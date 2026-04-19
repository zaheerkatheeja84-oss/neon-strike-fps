/**
 * App.tsx — Neon Strike FPS
 *
 * CRITICAL FIXES vs previous version:
 * 1. Removed PointerLockManager — PlayerController handles its own mouse lock
 * 2. PlayerController always mounts when isPlaying (no conditional render)
 * 3. GunView canvas does NOT affect the main canvas CSS override in index.css
 *    — fixed by giving the gun canvas explicit width/height styles
 */
import { Physics } from "@react-three/cannon";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { Arena } from "./components/Arena";
import { EnemyManager } from "./components/EnemyManager";
import { GameOverlay } from "./components/GameOverlay";
import { GunView } from "./components/GunView";
import { HUD } from "./components/HUD";
import { PlayerController } from "./components/PlayerController";
import { useGameStore } from "./store/gameStore";

function GameScene() {
  const isPlaying = useGameStore((s) => s.isPlaying);

  return (
    <Physics gravity={[0, -9.8, 0]} broadphase="SAP">
      <Arena />
      {isPlaying && <PlayerController />}
      <EnemyManager />
    </Physics>
  );
}

export default function App() {
  return (
    <div
      data-ocid="app.root"
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#050510",
      }}
    >
      {/* Main 3D game canvas */}
      <Canvas
        data-ocid="game.canvas"
        shadows
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100vh",
        }}
        camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1.4, 0] }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#050510"]} />
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>

      {/* Gun overlay — separate canvas, pointer-events none */}
      <GunView />

      {/* HUD — health, ammo, score, crosshair */}
      <HUD />

      {/* Start / Game Over overlay */}
      <GameOverlay />
    </div>
  );
}
