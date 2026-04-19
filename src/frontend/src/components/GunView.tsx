/**
 * GunView – First-person weapon rendered in a dedicated overlay Canvas.
 * Uses its own fixed camera so the gun is always at bottom-right,
 * independent of the main game world camera movement.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";

// ─── Muzzle flash state (module-level so GunMesh and GunView share it) ────────
export const gunShootSignal: { current: number } = { current: 0 };

// ─── The Gun Mesh (box-geometry FPS gun) ─────────────────────────────────────
function GunMesh() {
  const groupRef = useRef<THREE.Group>(null);
  // recoil: 0 = rest, 1 = max kicked
  const recoilRef = useRef(0);
  const lastShootSignal = useRef(0);
  const [muzzleFlash, setMuzzleFlash] = useState(false);
  const muzzleFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Detect new shoot signal
    if (gunShootSignal.current !== lastShootSignal.current) {
      lastShootSignal.current = gunShootSignal.current;
      recoilRef.current = 1; // kick back

      // Trigger muzzle flash
      setMuzzleFlash(true);
      if (muzzleFlashTimer.current) clearTimeout(muzzleFlashTimer.current);
      muzzleFlashTimer.current = setTimeout(() => setMuzzleFlash(false), 80);
    }

    // Lerp recoil back to rest
    recoilRef.current = THREE.MathUtils.lerp(
      recoilRef.current,
      0,
      Math.min(1, delta * 14),
    );

    // Apply recoil: push gun back (+Z toward camera) and slightly up
    const kickZ = recoilRef.current * 0.12;
    const kickY = recoilRef.current * 0.04;
    groupRef.current.position.set(0.36, -0.28 + kickY, -0.55 + kickZ);
    // Slight upward rotation on kick
    groupRef.current.rotation.x = recoilRef.current * 0.12;
  });

  // Neon magenta material
  const bodyMat = (
    <meshStandardMaterial
      color="#1a0020"
      emissive="#ff00cc"
      emissiveIntensity={muzzleFlash ? 2.2 : 0.55}
      roughness={0.2}
      metalness={0.85}
    />
  );

  const slideMat = (
    <meshStandardMaterial
      color="#0a000a"
      emissive="#cc00ff"
      emissiveIntensity={muzzleFlash ? 2.5 : 0.7}
      roughness={0.15}
      metalness={0.95}
    />
  );

  return (
    <group
      ref={groupRef}
      position={[0.36, -0.28, -0.55]}
      rotation={[0, 0.08, 0]}
    >
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.38]} />
        {bodyMat}
      </mesh>

      {/* Slide (top barrel housing) */}
      <mesh position={[0, 0.065, -0.04]}>
        <boxGeometry args={[0.1, 0.055, 0.28]} />
        {slideMat}
      </mesh>

      {/* Barrel extension */}
      <mesh position={[0, 0.065, -0.24]}>
        <boxGeometry args={[0.055, 0.045, 0.12]} />
        {slideMat}
      </mesh>

      {/* Grip */}
      <mesh position={[0, -0.1, 0.1]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.1, 0.14, 0.08]} />
        {bodyMat}
      </mesh>

      {/* Trigger guard */}
      <mesh position={[0, -0.06, -0.02]}>
        <boxGeometry args={[0.09, 0.02, 0.1]} />
        <meshStandardMaterial
          color="#0a000a"
          emissive="#ff00cc"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Neon stripe on slide */}
      <mesh position={[0.06, 0.068, -0.04]}>
        <boxGeometry args={[0.005, 0.01, 0.24]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={muzzleFlash ? 4 : 1.8}
          roughness={0}
          metalness={1}
        />
      </mesh>
      <mesh position={[-0.06, 0.068, -0.04]}>
        <boxGeometry args={[0.005, 0.01, 0.24]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={muzzleFlash ? 4 : 1.8}
          roughness={0}
          metalness={1}
        />
      </mesh>

      {/* Muzzle flash */}
      {muzzleFlash && (
        <>
          <mesh position={[0, 0.065, -0.32]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#00ffff"
              emissiveIntensity={5}
              roughness={0}
              metalness={0}
              transparent
              opacity={0.9}
            />
          </mesh>
          <pointLight
            position={[0, 0.065, -0.32]}
            color="#00ffff"
            intensity={8}
            distance={1.2}
            decay={2}
          />
        </>
      )}

      {/* Persistent gun glow light */}
      <pointLight
        color="#ff00cc"
        intensity={muzzleFlash ? 0 : 0.6}
        distance={0.8}
        decay={2}
        position={[0, 0.06, -0.1]}
      />
    </group>
  );
}

// ─── GunView: separate canvas overlay ─────────────────────────────────────────
export function GunView() {
  const isPlaying = useGameStore((s) => s.isPlaying);
  const isGameOver = useGameStore((s) => s.isGameOver);

  // Always render div for z-index stacking, just hide contents when not needed
  if (!isPlaying || isGameOver) return null;

  return (
    <div
      data-ocid="gun.canvas_container"
      aria-hidden="true"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        width: 320,
        height: 220,
        pointerEvents: "none",
        zIndex: 90,
        // Prevent the div from interfering with game canvas clicks
        userSelect: "none",
      }}
    >
      <Canvas
        camera={{
          fov: 55,
          near: 0.01,
          far: 10,
          position: [0, 0, 0],
        }}
        gl={{ antialias: true, alpha: true }}
        style={{
          background: "transparent",
          width: "320px",
          height: "220px",
          display: "block",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        {/* Lighting for the gun */}
        <ambientLight color="#220022" intensity={1.2} />
        <directionalLight
          position={[0.5, 1, 0.5]}
          color="#ff88ff"
          intensity={1.5}
        />
        <directionalLight
          position={[-0.5, 0.5, 0.3]}
          color="#88ffff"
          intensity={0.8}
        />
        <GunMesh />
      </Canvas>
    </div>
  );
}

export default GunView;
