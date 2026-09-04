"""
stl_geometry.py — pure-numpy STL parsing and geometric feature extraction.

No trimesh/numpy-stl dependency on purpose: one less thing to install on
Windows, and the geometry we need (volume, surface area, bounding box) is
straightforward enough to compute directly from the triangle soup.

Supports both binary and ASCII STL (auto-detected).
"""

import struct
import numpy as np


def _is_binary_stl(path: str) -> bool:
    with open(path, "rb") as f:
        header = f.read(80)
        f.seek(0, 2)
        size = f.tell()
    if size < 84:
        return False
    with open(path, "rb") as f:
        f.seek(80)
        (n_tri,) = struct.unpack("<I", f.read(4))
    expected_size = 84 + n_tri * 50
    return size == expected_size


def _parse_binary_stl(path: str) -> np.ndarray:
    with open(path, "rb") as f:
        f.read(80)
        (n_tri,) = struct.unpack("<I", f.read(4))
        triangles = np.empty((n_tri, 3, 3), dtype=np.float64)
        for i in range(n_tri):
            f.read(12)
            verts = struct.unpack("<9f", f.read(36))
            f.read(2)
            triangles[i] = np.array(verts, dtype=np.float64).reshape(3, 3)
    return triangles


def _parse_ascii_stl(path: str) -> np.ndarray:
    triangles = []
    current = []
    with open(path, "r", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line.startswith("vertex"):
                parts = line.split()[1:4]
                current.append([float(x) for x in parts])
                if len(current) == 3:
                    triangles.append(current)
                    current = []
    return np.array(triangles, dtype=np.float64)


def parse_stl(path: str) -> np.ndarray:
    """Returns an (N, 3, 3) array of triangle vertices."""
    if _is_binary_stl(path):
        return _parse_binary_stl(path)
    return _parse_ascii_stl(path)


def signed_volume_mm3(triangles: np.ndarray) -> float:
    v0, v1, v2 = triangles[:, 0], triangles[:, 1], triangles[:, 2]
    cross = np.cross(v1, v2)
    vol = np.einsum("ij,ij->i", v0, cross).sum() / 6.0
    return abs(vol)


def surface_area_mm2(triangles: np.ndarray) -> float:
    v0, v1, v2 = triangles[:, 0], triangles[:, 1], triangles[:, 2]
    cross = np.cross(v1 - v0, v2 - v0)
    areas = 0.5 * np.linalg.norm(cross, axis=1)
    return areas.sum()


def bounding_box_mm(triangles: np.ndarray):
    pts = triangles.reshape(-1, 3)
    mins = pts.min(axis=0)
    maxs = pts.max(axis=0)
    size = maxs - mins
    return float(size[0]), float(size[1]), float(size[2])


def extract_features(path: str) -> dict:
    triangles = parse_stl(path)
    x, y, z = bounding_box_mm(triangles)
    return {
        "volume_mm3": round(signed_volume_mm3(triangles), 3),
        "surface_area_mm2": round(surface_area_mm2(triangles), 3),
        "bounding_box_x": round(x, 3),
        "bounding_box_y": round(y, 3),
        "bounding_box_z": round(z, 3),
    }


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python stl_geometry.py <path-to-stl>")
        sys.exit(1)
    features = extract_features(sys.argv[1])
    for k, v in features.items():
        print(f"{k}: {v}")
