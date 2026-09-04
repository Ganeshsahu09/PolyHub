"""
PolyHub ML Service — real print-time/material estimator (Milestone 5).

Replaces the heuristic stub with two trained LightGBM regressors (print
time, filament volume), loaded from MODEL_DIR at startup. If the model
artifacts aren't found there, falls back to the old heuristic rather than
crashing the service — so a missing/misconfigured model degrades checkout
gracefully instead of taking it down.

Also exposes /extract-geometry, used by the Node API right after a
designer's model finishes uploading, so real volume/surface-area/bounding-
box features exist for the estimator to use later. STL only for now — the
platform also accepts .glb/.obj, but this service doesn't parse those yet;
callers get a clear 422 rather than a silently wrong estimate.
"""

import os
import json

import lightgbm as lgb
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from geometry import extract_features

app = FastAPI(title="PolyHub ML Service", version="0.2.0")

MODEL_DIR = os.environ.get("ML_MODEL_DIR", "model_artifacts")

# Rough per-material filament cost, $/mm^3 — derived from typical $20-25/kg
# spool prices and material density. This is an estimate of material cost
# only, not a substitute for the designer's sale price — callers decide
# what (if anything) to do with predicted_material_cost.
MATERIAL_COST_PER_MM3 = {
    "PLA": 0.000025,
    "PETG": 0.000027,
    "ABS": 0.000023,
}

_time_model = None
_filament_model = None
_metadata = None


def _try_load_models():
    global _time_model, _filament_model, _metadata
    time_path = os.path.join(MODEL_DIR, "time_model.txt")
    filament_path = os.path.join(MODEL_DIR, "filament_model.txt")
    meta_path = os.path.join(MODEL_DIR, "metadata.json")

    if not (os.path.exists(time_path) and os.path.exists(filament_path) and os.path.exists(meta_path)):
        print(f"[ml] No trained model found in '{MODEL_DIR}' — falling back to heuristic estimator.")
        return

    _time_model = lgb.Booster(model_file=time_path)
    _filament_model = lgb.Booster(model_file=filament_path)
    with open(meta_path) as f:
        _metadata = json.load(f)
    print(f"[ml] Loaded trained model v{_metadata.get('version', '?')} "
          f"(trained on {_metadata.get('trained_on_rows', '?')} rows) from '{MODEL_DIR}'")


_try_load_models()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "polyhub-ml",
        "model_loaded": _time_model is not None,
        "model_version": (_metadata or {}).get("version", "heuristic-v0"),
    }


class EstimateRequest(BaseModel):
    volume_mm3: float
    surface_area_mm2: float | None = None
    bounding_box_x: float | None = None
    bounding_box_y: float | None = None
    bounding_box_z: float | None = None
    material: str
    infill_percent: float = 20.0
    layer_height_mm: float = 0.2


class EstimateResponse(BaseModel):
    predicted_time_min: float
    predicted_material_cost: float
    model_version: str


def _heuristic_estimate(req: EstimateRequest) -> EstimateResponse:
    density_factor = 1 + (req.infill_percent / 100)
    predicted_time_min = (req.volume_mm3 / 1000) * density_factor * 2
    predicted_cost = (req.volume_mm3 / 1000) * 0.05 * density_factor
    return EstimateResponse(
        predicted_time_min=round(predicted_time_min, 1),
        predicted_material_cost=round(predicted_cost, 2),
        model_version="heuristic-v0",
    )


@app.post("/estimate/print-job", response_model=EstimateResponse)
def estimate_print_job(req: EstimateRequest):
    if _time_model is None:
        return _heuristic_estimate(req)

    if req.surface_area_mm2 is None or req.bounding_box_x is None:
        return _heuristic_estimate(req)

    materials = _metadata["materials"]
    if req.material not in materials:
        raise HTTPException(400, f"Unknown material '{req.material}'. Expected one of {materials}.")

    row = {
        "volume_mm3": req.volume_mm3,
        "surface_area_mm2": req.surface_area_mm2,
        "bounding_box_x": req.bounding_box_x,
        "bounding_box_y": req.bounding_box_y,
        "bounding_box_z": req.bounding_box_z,
        "infill_pct": req.infill_percent,
        "layer_height": req.layer_height_mm,
    }
    for m in materials:
        row[f"material_{m}"] = 1 if req.material == m else 0

    feature_columns = _metadata["feature_columns"]
    X = np.array([[row[c] for c in feature_columns]])

    predicted_time_s = float(_time_model.predict(X)[0])
    predicted_filament_mm3 = float(_filament_model.predict(X)[0])
    cost_per_mm3 = MATERIAL_COST_PER_MM3.get(req.material, 0.000025)

    return EstimateResponse(
        predicted_time_min=round(max(predicted_time_s, 0) / 60, 1),
        predicted_material_cost=round(max(predicted_filament_mm3, 0) * cost_per_mm3, 2),
        model_version=_metadata.get("version", "v1"),
    )


class GeometryRequest(BaseModel):
    file_url: str
    file_format: str


class GeometryResponse(BaseModel):
    volume_mm3: float
    surface_area_mm2: float
    bounding_box_x: float
    bounding_box_y: float
    bounding_box_z: float


@app.post("/extract-geometry", response_model=GeometryResponse)
def extract_geometry(req: GeometryRequest):
    if req.file_format.lower() != "stl":
        raise HTTPException(
            422,
            f"Geometry extraction only supports STL today, got '{req.file_format}'. "
            "This model won't get real print-time estimates until STL support is added "
            "or geometry is extracted another way.",
        )

    resp = requests.get(req.file_url, timeout=30)
    if resp.status_code != 200:
        raise HTTPException(502, f"Couldn't download file for geometry extraction (status {resp.status_code})")

    tmp_path = "/tmp/_geom_extract.stl"
    with open(tmp_path, "wb") as f:
        f.write(resp.content)

    try:
        features = extract_features(tmp_path)
    except Exception as e:
        raise HTTPException(422, f"Couldn't parse STL file: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    return GeometryResponse(**features)