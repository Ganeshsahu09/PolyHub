import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";

function GeometricCrystal() {
  const meshRef = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.25;
      meshRef.current.rotation.y += delta * 0.35;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x -= delta * 0.4;
      innerRef.current.rotation.y -= delta * 0.5;
    }
  });

  return (
    <group>
      {/* Outer Wireframe Polyhedron */}
      <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[2.2, 1]} />
          <meshStandardMaterial
            color="#2dd4bf"
            wireframe
            roughness={0.1}
            metalness={0.9}
            wireframeLinewidth={1.5}
            emissive="#14b8a6"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Inner Solid Core */}
        <mesh ref={innerRef}>
          <octahedronGeometry args={[1.1, 0]} />
          <meshStandardMaterial
            color="#0d9488"
            roughness={0.2}
            metalness={0.8}
            wireframe={false}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function Interactive3DBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-40 lg:opacity-60">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.8} color="#5eead4" />
        <pointLight position={[-10, -5, -5]} intensity={1} color="#0f766e" />
        <GeometricCrystal />
      </Canvas>
    </div>
  );
}
