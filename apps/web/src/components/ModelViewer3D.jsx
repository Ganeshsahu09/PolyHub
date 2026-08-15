import React, { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Center, Html } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

function LoadingIndicator() {
  return (
    <Html center>
      <div className="flex items-center gap-2 rounded-md bg-zinc-900/90 px-3 py-2 text-xs text-teal-300 border border-zinc-800">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        Loading model...
      </div>
    </Html>
  );
}

// --- One component per format. Each calls exactly one loader hook,
// unconditionally, so React's hook-order rules are never violated. ---

function GltfModel({ modelUrl }) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} />;
}

function ObjModel({ modelUrl }) {
  const obj = useLoader(OBJLoader, modelUrl);
  return <primitive object={obj} />;
}

function StlModel({ modelUrl }) {
  // STLLoader returns raw BufferGeometry with no material/color info,
  // so we supply a neutral material ourselves.
  const geometry = useLoader(STLLoader, modelUrl);
  return (
    <mesh castShadow receiveShadow geometry={geometry}>
      <meshStandardMaterial color="#9ca3af" roughness={0.45} metalness={0.25} />
    </mesh>
  );
}

function PlaceholderBox() {
  return (
    <mesh castShadow receiveShadow>
      <boxGeometry args={[2, 4, 2]} />
      <meshStandardMaterial color="#2dd4bf" wireframe roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

// Dispatches to the right loader component based on the model's actual
// file format. This function itself calls NO hooks — it just decides
// which child component (each with its own single hook) to render.
function AssetModel({ modelUrl, fileFormat }) {
  if (!modelUrl) return <PlaceholderBox />;

  const format = (fileFormat || modelUrl.split("?")[0].split(".").pop() || "").toLowerCase();

  if (format === "obj") return <ObjModel modelUrl={modelUrl} />;
  if (format === "stl") return <StlModel modelUrl={modelUrl} />;
  return <GltfModel modelUrl={modelUrl} />; // default: glb/gltf
}

// Catches loader errors (e.g. a genuinely corrupt file) so only the
// viewer panel degrades, not the whole page.
class ViewerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ModelViewer3D failed to load asset:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[300px] w-full items-center justify-center bg-zinc-950/40 rounded-xl">
          <p className="max-w-xs text-center text-xs text-red-400">
            This model's 3D file couldn't be loaded. It may be an unsupported or corrupted file.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ModelViewer3D({ modelUrl = null, fileFormat = null }) {
  return (
    <ViewerErrorBoundary key={modelUrl}>
      <div className="w-full h-full min-h-[300px] bg-zinc-950/40 relative rounded-xl overflow-hidden">
        <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          <Suspense fallback={<LoadingIndicator />}>
            <Stage intensity={0.5} environment={null} adjustCamera={true}>
              <Center>
                <AssetModel modelUrl={modelUrl} fileFormat={fileFormat} />
              </Center>
            </Stage>
          </Suspense>

          <OrbitControls enableZoom enablePan minDistance={3} maxDistance={15} makeDefault />
        </Canvas>

        <div className="absolute bottom-3 right-3 pointer-events-none bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono px-2 py-1 rounded text-zinc-400 backdrop-blur-sm shadow-md">
          🖱️ Click & Drag to Rotate Design
        </div>
      </div>
    </ViewerErrorBoundary>
  );
}