/**
 * PlayerController — FPS player with WASD movement, mouse look, jump, shoot.
 *
 * CRITICAL FIX: Does NOT use PointerLockControls from drei.
 * Instead uses manual mouse tracking that ALWAYS works:
 *   - Tries pointer lock for clean relative movement
 *   - Falls back to delta-from-last-position tracking if pointer lock is denied
 * This means controls work in ALL browsers without needing pointer lock.
 */
import { useBox } from "@react-three/cannon";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import { playerPositionRef } from "./EnemyManager";
import { gunShootSignal } from "./GunView";

const MOVE_SPEED = 8;
const JUMP_VELOCITY = 7;
const PLAYER_HEIGHT = 1.8;
const EYE_OFFSET = 0.75;
const MOUSE_SENSITIVITY = 0.002;

// ─── Key state (module-level so it survives re-renders) ─────────────────────
const keys: Record<string, boolean> = {};

// ─── Camera Euler (module-level for stability) ──────────────────────────────
const cameraEuler = new THREE.Euler(0, 0, 0, "YXZ");

// ─── Keyboard hook ───────────────────────────────────────────────────────────
function useKeyboard() {
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);
}

// Expose shoot signal so canvas click handler in App.tsx can fire it
export const shootRayRef: { current: (() => void) | null } = { current: null };

export function PlayerController() {
  const { camera, scene } = useThree();
  const isPlaying = useGameStore((s) => s.isPlaying);
  const isGameOver = useGameStore((s) => s.isGameOver);

  const isGrounded = useRef(false);
  const bodyPosition = useRef(new THREE.Vector3(0, PLAYER_HEIGHT / 2, 0));
  const lastVelocityY = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());

  // Mouse look state
  const isPointerLocked = useRef(false);
  const lastMouseX = useRef(-1);
  const lastMouseY = useRef(-1);

  useKeyboard();

  // ─── Physics body ─────────────────────────────────────────────────────────
  const [, bodyApi] = useBox<THREE.Mesh>(() => ({
    mass: 80,
    position: [0, PLAYER_HEIGHT / 2, 0],
    args: [0.6, PLAYER_HEIGHT, 0.6],
    linearDamping: 0.9,
    angularFactor: [0, 0, 0] as [number, number, number],
    allowSleep: false,
  }));

  useEffect(() => {
    const unsub = bodyApi.position.subscribe((pos) => {
      bodyPosition.current.set(pos[0], pos[1], pos[2]);
    });
    return unsub;
  }, [bodyApi]);

  useEffect(() => {
    const unsub = bodyApi.velocity.subscribe((vel) => {
      lastVelocityY.current = vel[1];
      if (Math.abs(vel[1]) < 0.15) {
        isGrounded.current = true;
      } else if (vel[1] > 0.5) {
        isGrounded.current = false;
      }
    });
    return unsub;
  }, [bodyApi]);

  // ─── Mouse look — hybrid pointer lock + direct delta ──────────────────────
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Request pointer lock when game starts
    const tryLock = () => {
      canvas.requestPointerLock().catch(() => {
        // Pointer lock denied — fallback mode is already active via mousemove
      });
    };

    // Try to lock with a small delay so overlay is gone
    const lockTimer = setTimeout(tryLock, 150);

    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
      if (!isPointerLocked.current) {
        // Reset last position so fallback mode starts fresh
        lastMouseX.current = -1;
        lastMouseY.current = -1;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPlaying || isGameOver) return;

      let dx: number;
      let dy: number;

      if (isPointerLocked.current) {
        // Pointer locked: use clean relative deltas
        dx = e.movementX;
        dy = e.movementY;
      } else {
        // Fallback: compute delta from last known position
        if (lastMouseX.current === -1) {
          lastMouseX.current = e.clientX;
          lastMouseY.current = e.clientY;
          return;
        }
        dx = e.clientX - lastMouseX.current;
        dy = e.clientY - lastMouseY.current;
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
      }

      // Apply to camera euler (YXZ order = yaw then pitch)
      cameraEuler.setFromQuaternion(camera.quaternion);
      cameraEuler.y -= dx * MOUSE_SENSITIVITY;
      cameraEuler.x -= dy * MOUSE_SENSITIVITY;
      // Clamp pitch so player can't look completely upside down
      cameraEuler.x = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, cameraEuler.x),
      );
      camera.quaternion.setFromEuler(cameraEuler);
    };

    // Re-lock on canvas click (if pointer lock was lost)
    const onCanvasClick = () => {
      if (!isPointerLocked.current && isPlaying && !isGameOver) {
        tryLock();
      }
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    // Use document for mousemove to catch all mouse movement even outside canvas
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onCanvasClick);

    return () => {
      clearTimeout(lockTimer);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onCanvasClick);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
      isPointerLocked.current = false;
    };
  }, [isPlaying, isGameOver, camera]);

  // ─── Shoot handler ────────────────────────────────────────────────────────
  const shootRay = () => {
    const state = useGameStore.getState();
    if (!state.isPlaying || state.isGameOver) return;
    if (state.ammo <= 0) return;

    state.shoot();
    gunShootSignal.current += 1;

    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = raycaster.current.intersectObjects(scene.children, true);

    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData.enemyId) {
          if (typeof obj.userData.hitEnemy === "function") {
            (obj.userData.hitEnemy as () => void)();
          }
          return;
        }
        obj = obj.parent;
      }
      break;
    }
  };

  // Expose shoot for external canvas click handler
  useEffect(() => {
    shootRayRef.current = shootRay;
  });

  // Reload on R key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyR") {
        useGameStore.getState().reload();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Shoot on mouse click — works with OR without pointer lock
  const shootRayRef2 = useRef(shootRay);
  useEffect(() => {
    shootRayRef2.current = shootRay;
  });

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      shootRayRef2.current();
    };

    const canvas = document.querySelector("canvas");
    canvas?.addEventListener("mousedown", handleClick);
    return () => {
      canvas?.removeEventListener("mousedown", handleClick);
    };
  }, [isPlaying, isGameOver]);

  // ─── Game loop: movement + camera position ────────────────────────────────
  useFrame(() => {
    if (!isPlaying || isGameOver) return;

    // Build movement vectors from camera orientation
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const velocity = new THREE.Vector3();

    if (keys.KeyW || keys.ArrowUp)
      velocity.addScaledVector(forward, MOVE_SPEED);
    if (keys.KeyS || keys.ArrowDown)
      velocity.addScaledVector(forward, -MOVE_SPEED);
    if (keys.KeyD || keys.ArrowRight)
      velocity.addScaledVector(right, MOVE_SPEED);
    if (keys.KeyA || keys.ArrowLeft)
      velocity.addScaledVector(right, -MOVE_SPEED);

    if (velocity.lengthSq() > 0) {
      bodyApi.velocity.set(velocity.x, lastVelocityY.current, velocity.z);
    } else {
      bodyApi.velocity.set(0, lastVelocityY.current, 0);
    }

    // Jump
    if (keys.Space && isGrounded.current) {
      isGrounded.current = false;
      bodyApi.velocity.set(velocity.x, JUMP_VELOCITY, velocity.z);
    }

    // Sync camera to body position
    camera.position.set(
      bodyPosition.current.x,
      bodyPosition.current.y + EYE_OFFSET,
      bodyPosition.current.z,
    );

    // Share position with EnemyManager
    playerPositionRef.set(
      bodyPosition.current.x,
      bodyPosition.current.y,
      bodyPosition.current.z,
    );
  });

  // No JSX needed — this component is pure logic
  return null;
}

export default PlayerController;
