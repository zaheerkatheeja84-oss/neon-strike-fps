import { Physics } from "@react-three/cannon";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef } from "react";
import { Arena } from "./components/Arena";
import { EnemyManager } from "./components/EnemyManager";
import { GameOverlay } from "./components/GameOverlay";
import { HUD } from "./components/HUD";
import { PlayerController } from "./components/PlayerController";
import { useGameStore } from "./store/gameStore";

export function GameScene() {
  const isPlaying = useGameStore((s) => s.isPlaying);

  return (
    <Physics gravity={[0, -9.8, 0]} broadphase="SAP">
      <Arena />
      {isPlaying && <PlayerController />}
      <EnemyManager />
    </Physics>
  );
}

// Pointer lock manager
function PointerLockManager() {
  const isPlaying = useGameStore((s) => s.isPlaying);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const requestLock = useCallback(() => {
    const canvas = document.querySelector("canvas");
    if (canvas && isPlaying && !isGameOver) {
      canvas.requestPointerLock();
    }
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (isPlaying && !isGameOver) {
      const canvas = document.querySelector("canvas");
      canvasRef.current = canvas;
      canvas?.addEventListener("click", requestLock);
      requestLock();
    } else {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
    return () => {
      canvasRef.current?.removeEventListener("click", requestLock);
    };
  }, [isPlaying, isGameOver, requestLock]);

  return null;
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
      <Canvas
        data-ocid="game.canvas"
        shadows
        style={{ position: "absolute", inset: 0 }}
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#050510"]} />
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>

      <PointerLockManager />
      <HUD />
      <GameOverlay />
    </div>
  );
}
