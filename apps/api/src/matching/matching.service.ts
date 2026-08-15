import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  // Haversine distance in km between two lat/lng points.
  // Good enough for now — a real PostGIS query replaces this once
  // the printer base is large enough that in-app filtering gets slow.
  private distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Finds printers that can fulfill a given order: must support the
  // requested material, and (if the buyer's location is known) be
  // within a reasonable radius, ranked closest-first.
  async findCandidates(params: {
    material: string;
    buyerLat?: number;
    buyerLng?: number;
    maxDistanceKm?: number;
  }) {
    const printers = await this.prisma.printerProfile.findMany({
      where: {
        isVerified: true,
        materialsSupported: { has: params.material },
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (params.buyerLat == null || params.buyerLng == null) {
      // No buyer location yet — just return eligible printers unranked.
      return printers.map((p) => ({ ...p, distanceKm: null }));
    }

    const withDistance = printers
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        ...p,
        distanceKm: this.distanceKm(params.buyerLat!, params.buyerLng!, p.latitude!, p.longitude!),
      }))
      .filter((p) => params.maxDistanceKm == null || p.distanceKm <= params.maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance;
  }
}