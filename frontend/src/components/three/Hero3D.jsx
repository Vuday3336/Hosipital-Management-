import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Environment } from "@react-three/drei";

const PulseCore = () => (
  <Float speed={1.6} rotationIntensity={0.9} floatIntensity={1.4}>
    <mesh>
      <icosahedronGeometry args={[1.5, 4]} />
      <MeshDistortMaterial
        color="#0f7a6b"
        distort={0.38}
        speed={1.8}
        roughness={0.15}
        metalness={0.4}
        emissive="#0a5449"
        emissiveIntensity={0.25}
      />
    </mesh>
  </Float>
);

const OrbitRing = ({ radius, tilt, color, speed }) => (
  <Float speed={speed} floatIntensity={0.6} rotationIntensity={0}>
    <mesh rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 16, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.35} />
    </mesh>
  </Float>
);

// Isolated to the marketing/auth pages — dashboards never mount this, keeping their
// bundles free of three.js entirely.
export const Hero3D = ({ className }) => (
  <div className={className} aria-hidden="true">
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[4, 4, 4]} intensity={1.1} color="#3bb99b" />
      <pointLight position={[-4, -2, -3]} intensity={0.6} color="#68d1b6" />

      <Suspense fallback={null}>
        <PulseCore />
        <OrbitRing radius={2.2} tilt={Math.PI / 2.4} color="#3bb99b" speed={1.2} />
        <OrbitRing radius={2.6} tilt={Math.PI / 1.6} color="#0f7a6b" speed={0.9} />
        <Sparkles count={60} scale={6} size={2} speed={0.35} color="#9de5cf" />
        <Environment preset="city" />
      </Suspense>
    </Canvas>
  </div>
);
