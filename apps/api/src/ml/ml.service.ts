import { Injectable, Logger } from '@nestjs/common';

export interface GeometryFeatures {
  volumeMm3: number;
  surfaceAreaMm2: number;
  boundingBoxX: number;
  boundingBoxY: number;
  boundingBoxZ: number;
}

export interface PrintEstimate {
  predictedTimeMin: number;
  predictedMaterialCost: number;
  modelVersion: string;
}

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly baseUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';

  // Every call here is best-effort: the ML service being down or a model
  // upload being a format it can't parse yet should never block checkout
  // or catalog uploads — callers get `null` back and fall back gracefully,
  // the same way the ML service itself falls back to a heuristic when no
  // trained model is loaded.

  async extractGeometry(fileUrl: string, fileFormat: string): Promise<GeometryFeatures | null> {
    try {
      const res = await fetch(`${this.baseUrl}/extract-geometry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: fileUrl, file_format: fileFormat }),
      });
      if (!res.ok) {
        this.logger.warn(`Geometry extraction skipped (${res.status}): ${await res.text()}`);
        return null;
      }
      const data = await res.json();
      return {
        volumeMm3: data.volume_mm3,
        surfaceAreaMm2: data.surface_area_mm2,
        boundingBoxX: data.bounding_box_x,
        boundingBoxY: data.bounding_box_y,
        boundingBoxZ: data.bounding_box_z,
      };
    } catch (err: any) {
      this.logger.warn(`Geometry extraction failed: ${err.message}`);
      return null;
    }
  }

  async estimatePrintJob(params: {
    volumeMm3: number;
    surfaceAreaMm2?: number | null;
    boundingBoxX?: number | null;
    boundingBoxY?: number | null;
    boundingBoxZ?: number | null;
    material: string;
    infillPercent?: number;
    layerHeightMm?: number;
  }): Promise<PrintEstimate | null> {
    try {
      const res = await fetch(`${this.baseUrl}/estimate/print-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volume_mm3: params.volumeMm3,
          surface_area_mm2: params.surfaceAreaMm2 ?? null,
          bounding_box_x: params.boundingBoxX ?? null,
          bounding_box_y: params.boundingBoxY ?? null,
          bounding_box_z: params.boundingBoxZ ?? null,
          material: params.material,
          infill_percent: params.infillPercent ?? 20,
          layer_height_mm: params.layerHeightMm ?? 0.2,
        }),
      });
      if (!res.ok) {
        this.logger.warn(`Print estimate skipped (${res.status}): ${await res.text()}`);
        return null;
      }
      const data = await res.json();
      return {
        predictedTimeMin: data.predicted_time_min,
        predictedMaterialCost: data.predicted_material_cost,
        modelVersion: data.model_version,
      };
    } catch (err: any) {
      this.logger.warn(`Print estimate failed: ${err.message}`);
      return null;
    }
  }
}
