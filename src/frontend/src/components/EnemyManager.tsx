/**
 * EnemyManager — spawns and controls enemies.
 *
 * CRITICAL FIX: Initial 3 enemies spawn in a visible semicircle ~6 units in
 * front of the player (not at arena edges). Subsequent enemies spawn at edges.
 * Enemies move directly toward player using velocity (not forces) each frame.
 */
import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import type { Enemy } from "../types/game";

// ─── Constants ───────────────────────────────────────────────────────────────
const ARENA_HALF = 9.5;
const ENEMY_SPEED = 2.5;
const ENEMY_SIZE: [number, number, number] = [0.8, 1.6, 0.8];
const MAX_ENEMIES = 8;
const SPAWN_INTERVAL_MS = 3000;
const DAMAGE_THROTTLE_MS = 800;
const DAMAGE_AMOUNT = 10;
const DAMAGE_RANGE = 1.4;
const HIT_FLASH_MS = 150;
const KILL_SCORE = 100;

const MAGENTA = "#ff00ff";
const WHITE = "#ffffff";

// ─── Shared player position (written by PlayerController) ────────────────────
export const playerPositionRef = new THREE.Vector3(0, 0, 0);

// ─── Spawn positions ──────────────────────────────────────────────────────────

// Initial spawn: 3 enemies in front semicircle, clearly visible
function getInitialSpawnPositions(): Array<[number, number, number]> {
  // Spawn in front-left, front, front-right at ~6 units distance, Y=1 (eye level)
  return [
    [-3, 1, -6], // front-left
    [0, 1, -7], // directly in front
    [3, 1, -6], // front-right
  ];
}

// Subsequent spawn: random arena edge
function randomEdgeSpawn(): [number, number, number] {
  const side = Math.floor(Math.random() * 4);
  const t = (Math.random() * 2 - 1) * ARENA_HALF;
  switch (side) {
    case 0:
      return [ARENA_HALF, 1, t];
    case 1:
      return [-ARENA_HALF, 1, t];
    case 2:
      return [t, 1, ARENA_HALF];
    default:
      return [t, 1, -ARENA_HALF];
  }
}

// ─── Single enemy body ────────────────────────────────────────────────────────
interface EnemyBodyProps {
  enemy: Enemy;
  onDamagePlayer: (id: string) => void;
  onKill: (id: string) => void;
}

function EnemyBody({ enemy, onDamagePlayer, onKill }: EnemyBodyProps) {
  const [isHit, setIsHit] = useState(false);
  const bodyRef = useRef<THREE.Mesh>(null);
  const posRef = useRef(new THREE.Vector3(...enemy.position));
  const lastDamageTime = useRef(0);
  const currentVelY = useRef(0);

  const [ref, api] = useBox<THREE.Mesh>(() => ({
    mass: 60,
    position: enemy.position,
    args: ENEMY_SIZE,
    linearDamping: 0.6,
    angularFactor: [0, 0, 0] as [number, number, number],
    fixedRotation: true,
    allowSleep: false,
  }));

  // Track physics position
  useEffect(() => {
    const unsub = api.position.subscribe((p) => {
      posRef.current.set(p[0], p[1], p[2]);
    });
    return unsub;
  }, [api]);

  // Track Y velocity to preserve gravity when setting XZ
  useEffect(() => {
    const unsub = api.velocity.subscribe((v) => {
      currentVelY.current = v[1];
    });
    return unsub;
  }, [api]);

  // Every frame: chase player, deal damage on contact
  useFrame(() => {
    const playerPos = playerPositionRef;
    const enemyPos = posRef.current;

    const dx = playerPos.x - enemyPos.x;
    const dz = playerPos.z - enemyPos.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    if (distXZ > 0.6) {
      const nx = (dx / distXZ) * ENEMY_SPEED;
      const nz = (dz / distXZ) * ENEMY_SPEED;
      api.velocity.set(nx, currentVelY.current, nz);
    } else {
      api.velocity.set(0, currentVelY.current, 0);
    }

    // Deal damage if close enough
    const dist3d = enemyPos.distanceTo(playerPos);
    if (dist3d <= DAMAGE_RANGE) {
      const now = performance.now();
      if (now - lastDamageTime.current > DAMAGE_THROTTLE_MS) {
        lastDamageTime.current = now;
        onDamagePlayer(enemy.id);
      }
    }
  });

  // Merge physics ref with our local ref
  const setRefs = useCallback(
    (node: THREE.Mesh | null) => {
      (ref as React.MutableRefObject<THREE.Mesh | null>).current = node;
      bodyRef.current = node;
    },
    [ref],
  );

  // Flash white then die on hit
  const triggerHitFlash = useCallback(() => {
    setIsHit(true);
    setTimeout(() => {
      setIsHit(false);
      onKill(enemy.id);
    }, HIT_FLASH_MS);
  }, [enemy.id, onKill]);

  // Expose hit handler via mesh userData so PlayerController raycaster can call it
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.userData.enemyId = enemy.id;
      bodyRef.current.userData.hitEnemy = triggerHitFlash;
    }
  }, [enemy.id, triggerHitFlash]);

  return (
    <mesh
      ref={setRefs}
      castShadow
      userData={{ enemyId: enemy.id, hitEnemy: triggerHitFlash }}
    >
      {/* Tall capsule-like box for enemy body */}
      <boxGeometry args={ENEMY_SIZE} />
      <meshStandardMaterial
        color={isHit ? WHITE : MAGENTA}
        emissive={isHit ? WHITE : MAGENTA}
        emissiveIntensity={isHit ? 3 : 0.8}
        roughness={0.2}
        metalness={0.5}
      />
      {/* Bright glow so enemies are always visible */}
      <pointLight
        color={MAGENTA}
        intensity={isHit ? 4 : 2}
        distance={5}
        decay={2}
      />
    </mesh>
  );
}

// ─── EnemyManager ─────────────────────────────────────────────────────────────
export function EnemyManager() {
  const enemies = useGameStore((s) => s.enemies);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const spawnEnemy = useGameStore((s) => s.spawnEnemy);
  const setEnemies = useGameStore((s) => s.setEnemies);
  const takeDamage = useGameStore((s) => s.takeDamage);
  // Track if we've done the initial 3-enemy spawn for this game session
  const hasSpawnedInitial = useRef(false);

  // Reset initial spawn flag when game starts/resets
  useEffect(() => {
    if (!isPlaying) {
      hasSpawnedInitial.current = false;
    }
  }, [isPlaying]);

  // Spawn loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    // Spawn initial 3 enemies immediately in front of player
    if (!hasSpawnedInitial.current) {
      hasSpawnedInitial.current = true;
      const initPositions = getInitialSpawnPositions();
      initPositions.forEach((pos, i) => {
        const newEnemy: Enemy = {
          id: `enemy-init-${i}`,
          position: pos,
          alive: true,
        };
        spawnEnemy(newEnemy);
      });
    }

    // Then spawn 1 more at the arena edge every 3 seconds (up to MAX_ENEMIES)
    const interval = setInterval(() => {
      const alive = useGameStore.getState().enemies.filter((e) => e.alive);
      if (alive.length >= MAX_ENEMIES) return;
      const pos = randomEdgeSpawn();
      const newEnemy: Enemy = {
        id: `enemy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        position: pos,
        alive: true,
      };
      spawnEnemy(newEnemy);
    }, SPAWN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, spawnEnemy]);

  // Kill: remove from list, award 100 score
  const handleKill = useCallback(
    (id: string) => {
      // Award score then remove
      useGameStore.getState().addScore(KILL_SCORE);
      setEnemies(useGameStore.getState().enemies.filter((e) => e.id !== id));
    },
    [setEnemies],
  );

  const handleDamagePlayer = useCallback(
    (_id: string) => {
      takeDamage(DAMAGE_AMOUNT);
    },
    [takeDamage],
  );

  const aliveEnemies = enemies.filter((e) => e.alive);

  if (!isPlaying) return null;

  return (
    <group>
      {aliveEnemies.map((enemy) => (
        <EnemyBody
          key={enemy.id}
          enemy={enemy}
          onKill={handleKill}
          onDamagePlayer={handleDamagePlayer}
        />
      ))}
    </group>
  );
}

export default EnemyManager;
