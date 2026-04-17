import { useBox } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore } from "../store/gameStore";
import type { Enemy } from "../types/game";

// ─── Constants ───────────────────────────────────────────────────────────────
const ARENA_HALF = 10;
const ENEMY_SPEED = 2;
const ENEMY_SIZE: [number, number, number] = [0.8, 1.6, 0.8];
const MAX_ENEMIES = 8;
const SPAWN_INTERVAL_MS = 3000;
const DAMAGE_THROTTLE_MS = 1000;
const DAMAGE_AMOUNT = 5;
const DAMAGE_RANGE = 1.0;
const HIT_FLASH_MS = 120;

const MAGENTA_COLOR = "#ff00ff";
const WHITE_COLOR = "#ffffff";

// ─── Shared player position ref (written by PlayerController, read here) ─────
export const playerPositionRef = new THREE.Vector3(0, 0, 0);

// ─── Utility: random spawn position on arena edge ────────────────────────────
function randomEdgeSpawn(): [number, number, number] {
  const side = Math.floor(Math.random() * 4);
  const t = (Math.random() * 2 - 1) * ARENA_HALF;
  switch (side) {
    case 0:
      return [ARENA_HALF, 0.8, t];
    case 1:
      return [-ARENA_HALF, 0.8, t];
    case 2:
      return [t, 0.8, ARENA_HALF];
    default:
      return [t, 0.8, -ARENA_HALF];
  }
}

// ─── Single enemy body ───────────────────────────────────────────────────────
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
    mass: 1,
    position: enemy.position,
    args: ENEMY_SIZE,
    linearDamping: 0.4,
    angularFactor: [0, 0, 0] as [number, number, number],
    collisionFilterGroup: 2,
    collisionFilterMask: 1,
    fixedRotation: true,
  }));

  // Track physics position
  useEffect(() => {
    const unsub = api.position.subscribe((p) => {
      posRef.current.set(p[0], p[1], p[2]);
    });
    return unsub;
  }, [api]);

  // Track Y velocity so we can preserve it when setting XZ movement
  useEffect(() => {
    const unsub = api.velocity.subscribe((v) => {
      currentVelY.current = v[1];
    });
    return unsub;
  }, [api]);

  // Movement + damage detection each frame
  useFrame(() => {
    const playerPos = playerPositionRef;
    const enemyPos = posRef.current;

    const dx = playerPos.x - enemyPos.x;
    const dz = playerPos.z - enemyPos.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);

    // Move toward player (XZ only, preserve Y for gravity)
    if (distXZ > 0.5) {
      const nx = (dx / distXZ) * ENEMY_SPEED;
      const nz = (dz / distXZ) * ENEMY_SPEED;
      api.velocity.set(nx, currentVelY.current, nz);
    } else {
      api.velocity.set(0, currentVelY.current, 0);
    }

    // Damage player if within range
    const dist3d = enemyPos.distanceTo(playerPos);
    if (dist3d <= DAMAGE_RANGE) {
      const now = performance.now();
      if (now - lastDamageTime.current > DAMAGE_THROTTLE_MS) {
        lastDamageTime.current = now;
        onDamagePlayer(enemy.id);
      }
    }
  });

  // Combine ref from useBox with our bodyRef
  const setRefs = useCallback(
    (node: THREE.Mesh | null) => {
      (ref as React.MutableRefObject<THREE.Mesh | null>).current = node;
      bodyRef.current = node;
    },
    [ref],
  );

  // Flash white on hit
  const triggerHitFlash = useCallback(() => {
    setIsHit(true);
    setTimeout(() => {
      setIsHit(false);
      onKill(enemy.id);
    }, HIT_FLASH_MS);
  }, [enemy.id, onKill]);

  // Expose hit handler via mesh userData so PlayerController can call it
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
      <boxGeometry args={ENEMY_SIZE} />
      <meshStandardMaterial
        color={isHit ? WHITE_COLOR : MAGENTA_COLOR}
        emissive={isHit ? WHITE_COLOR : MAGENTA_COLOR}
        emissiveIntensity={isHit ? 2.5 : 0.6}
        roughness={0.3}
        metalness={0.4}
      />
      {/* Glow point light */}
      <pointLight
        color={MAGENTA_COLOR}
        intensity={isHit ? 3 : 1.2}
        distance={4}
        decay={2}
      />
    </mesh>
  );
}

// ─── EnemyManager ────────────────────────────────────────────────────────────
export function EnemyManager() {
  const enemies = useGameStore((s) => s.enemies);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const spawnEnemy = useGameStore((s) => s.spawnEnemy);
  const setEnemies = useGameStore((s) => s.setEnemies);
  const takeDamage = useGameStore((s) => s.takeDamage);

  // Spawn interval
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const interval = setInterval(() => {
      const alive = useGameStore.getState().enemies.filter((e) => e.alive);
      if (alive.length >= MAX_ENEMIES) return;

      const pos = randomEdgeSpawn();
      const newEnemy: Enemy = {
        id: `enemy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        position: pos,
        alive: true,
      };
      spawnEnemy(newEnemy);
    }, SPAWN_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, spawnEnemy]);

  // Kill handler: remove from state + award score via store killEnemy
  const handleKill = useCallback(
    (id: string) => {
      useGameStore.getState().killEnemy(id);
      setEnemies(useGameStore.getState().enemies.filter((e) => e.id !== id));
    },
    [setEnemies],
  );

  // Damage handler: throttled per enemy is handled inside EnemyBody
  const handleDamagePlayer = useCallback(
    (_id: string) => {
      takeDamage(DAMAGE_AMOUNT);
    },
    [takeDamage],
  );

  const aliveEnemies = enemies.filter((e) => e.alive);

  if (!isPlaying) return null;

  return (
    <group data-ocid="enemy.manager">
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
