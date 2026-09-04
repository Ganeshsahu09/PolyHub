"""
PolyHub ML Service — skeleton.

Today this just proves the service boundary exists and is callable from the
Node API. Real models get added starting in Phase 3 (see the production
plan, section 7.1: print time & cost estimator).
"""

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="PolyHub ML Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "polyhub-ml"}


class EstimateRequest(BaseModel):
    volume_mm3: float
    material: str
    infill_percent: float = 20.0
    layer_height_mm: float = 0.2


class EstimateResponse(BaseModel):
    predicted_time_min: float
    predicted_cost: float
    model_version: str


@app.post("/estimate/print-job", response_model=EstimateResponse)
def estimate_print_job(req: EstimateRequest):
    """
    STUB — replace with the real LightGBM model in Phase 3.

    Placeholder heuristic so the API contract exists and the Node backend
    has something real to integrate against today: a rough linear guess
    based on volume and infill, just so checkout isn't blocked on ML work.
    """
    density_factor = 1 + (req.infill_percent / 100)
    predicted_time_min = (req.volume_mm3 / 1000) * density_factor * 2
    predicted_cost = (req.volume_mm3 / 1000) * 0.05 * density_factor

    return EstimateResponse(
        predicted_time_min=round(predicted_time_min, 1),
        predicted_cost=round(predicted_cost, 2),
        model_version="heuristic-v0",
    )
