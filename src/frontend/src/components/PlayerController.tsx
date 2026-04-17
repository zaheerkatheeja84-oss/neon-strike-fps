import { useBox } from "@react-three/cannon";
import type { PublicApi } from "@react-three/cannon";
import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import { playerPositionRef } from "./EnemyManager";

const MOVE_SPEED = 8;
const JUMP_VELOCITY = 7;
const PLAYER_HEIGHT = 1.8;
const EYE_OFFSET = 0.75; // offset from center to eye level

// Track pressed keys
const keys: Record<string, boolean> = {};

function useKeyboard() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}

// Expose shoot ray function via a stable ref for the canvas click handler
export const shootRayRef: { current: (() => void) | null } = { current: null };

export function PlayerController() {
  const { camera, scene } = useThree();
  const isPlaying = useGameStore((s) => s.isPlaying);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const { shoot, ammo } = useGameStore();

  // Grounded tracking
  const isGrounded = useRef(false);
  // Physics body position tracker
  const bodyPosition = useRef<THREE.Vector3>(
    new THREE.Vector3(0, PLAYER_HEIGHT / 2, 0),
  );
  // Raycaster for shoot detection
  const raycaster = useRef(new THREE.Raycaster());
  // Controls ref
  const controlsRef = useRef<{ unlock: () => void } | null>(null);

  useKeyboard();

  // Physics body: box standing upright
  const [, bodyApi] = useBox<THREE.Mesh>(
    () => ({
      mass: 80,
      position: [0, PLAYER_HEIGHT / 2, 0],
      args: [0.6, PLAYER_HEIGHT, 0.6],
      linearDamping: 0.9,
      angularFactor: [0, 0, 0], // prevent tipping
      allowSleep: false,
      onCollide: (e) => {
        // Detect floor collision for grounded state
        if (e.contact.impactVelocity > 0.5) {
          const normal = e.contact.ni;
          // If the collision normal has upward component, we're on ground
          if (normal[1] > 0.5) {
            isGrounded.current = true;
          }
        }
      },
    }),
    undefined,
    // We don't need the mesh ref here, passing undefined
  );

  // Subscribe to body position so camera can follow
  useEffect(() => {
    const unsub = bodyApi.position.subscribe((pos) => {
      bodyPosition.current.set(pos[0], pos[1], pos[2]);
    });
    return unsub;
  }, [bodyApi]);

  // Reset grounded flag every frame; re-set on contact
  // Instead of relying solely on onCollide (which has timing issues),
  // we also check Y velocity near zero each frame
  const lastVelocityY = useRef(0);
  useEffect(() => {
    const unsub = bodyApi.velocity.subscribe((vel) => {
      lastVelocityY.current = vel[1];
      // If nearly stationary vertically, assume grounded
      if (Math.abs(vel[1]) < 0.15) {
        isGrounded.current = true;
      } else if (vel[1] > 0.5) {
        isGrounded.current = false;
      }
    });
    return unsub;
  }, [bodyApi]);

  // Shoot ray function
  const shootRay = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    if (ammo <= 0) return;
    shoot();

    // Set raycaster from camera center
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    for (const hit of intersects) {
      // Traverse up to find enemy mesh with userData.enemyId
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData.enemyId) {
          // Call the hit flash handler which triggers kill + score via handleKill
          if (typeof obj.userData.hitEnemy === "function") {
            (obj.userData.hitEnemy as () => void)();
          }
          break;
        }
        obj = obj.parent;
      }
      break; // only first hit
    }
  }, [isPlaying, isGameOver, ammo, shoot, camera, scene]);

  // Expose shoot for external use
  useEffect(() => {
    shootRayRef.current = shootRay;
  }, [shootRay]);

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

  useFrame(() => {
    if (!isPlaying || isGameOver) return;

    // Build movement direction in camera space
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
      // Set XZ velocity, preserve Y for gravity
      bodyApi.velocity.set(velocity.x, lastVelocityY.current, velocity.z);
    } else {
      // Dampen XZ only
      bodyApi.velocity.set(0, lastVelocityY.current, 0);
    }

    // Jump
    if (keys.Space && isGrounded.current) {
      isGrounded.current = false;
      bodyApi.velocity.set(velocity.x, JUMP_VELOCITY, velocity.z);
    }

    // Move camera to eye level above body
    camera.position.set(
      bodyPosition.current.x,
      bodyPosition.current.y + EYE_OFFSET,
      bodyPosition.current.z,
    );

    // Write player world position so EnemyManager can read it
    playerPositionRef.set(
      bodyPosition.current.x,
      bodyPosition.current.y,
      bodyPosition.current.z,
    );
  });

  // Handle click-to-shoot when pointer is locked
  useEffect(() => {
    const handleClick = () => {
      if (document.pointerLockElement) {
        shootRay();
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [shootRay]);

  // Unlock controls on game over
  useEffect(() => {
    if (isGameOver && controlsRef.current) {
      controlsRef.current.unlock();
    }
  }, [isGameOver]);

  if (!isPlaying) return null;

  return (
    <PointerLockControls
      ref={(ref) => {
        if (ref) {
          controlsRef.current = ref as unknown as { unlock: () => void };
        }
      }}
      makeDefault
    />
  );
}

// Helper to expose the physics API for use in GameScene
export function usePlayerApi(): PublicApi | null {
  return null; // Placeholder — PlayerController manages its own api internally
}

export default PlayerController;
