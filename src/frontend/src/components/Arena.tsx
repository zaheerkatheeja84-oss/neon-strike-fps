import { useBox, usePlane } from "@react-three/cannon";
import type { Triplet } from "@react-three/cannon";
import type { Mesh } from "three";

// Arena is 20x20 units. Walls are 0.5 thick, 3 tall.
const ARENA_HALF = 10;
const WALL_HEIGHT = 3;
const WALL_THICKNESS = 0.5;
const WALL_COLOR = "#001a1a";
const WALL_EMISSIVE = "#00ffff";

interface WallProps {
  position: Triplet;
  rotation: Triplet;
  size: Triplet;
}

function Wall({ position, rotation, size }: WallProps) {
  const [ref] = useBox<Mesh>(() => ({
    type: "Static",
    position,
    rotation,
    args: size,
  }));

  return (
    <mesh ref={ref} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={WALL_COLOR}
        emissive={WALL_EMISSIVE}
        emissiveIntensity={0.4}
        roughness={0.3}
        metalness={0.8}
      />
    </mesh>
  );
}

function Floor() {
  const [ref] = usePlane<Mesh>(() => ({
    type: "Static",
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    collisionFilterGroup: 1,
    collisionFilterMask: -1,
  }));

  return (
    <mesh ref={ref} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[ARENA_HALF * 2, ARENA_HALF * 2]} />
      <meshStandardMaterial
        color="#050510"
        roughness={0.8}
        metalness={0.2}
        emissive="#020208"
      />
    </mesh>
  );
}

function FloorGrid() {
  return (
    <gridHelper
      args={[ARENA_HALF * 2, 20, "oklch(0.3 0.12 262)", "oklch(0.15 0.06 262)"]}
      position={[0, 0.01, 0]}
    />
  );
}

function Ceiling() {
  return (
    <mesh position={[0, WALL_HEIGHT, 0]} receiveShadow>
      <planeGeometry args={[ARENA_HALF * 2, ARENA_HALF * 2]} />
      <meshStandardMaterial
        color="#020208"
        roughness={1}
        metalness={0}
        emissive="#010105"
        side={2}
      />
    </mesh>
  );
}

// Corner accent pillars for visual interest
function CornerPillar({ x, z }: { x: number; z: number }) {
  const [ref] = useBox<Mesh>(() => ({
    type: "Static",
    position: [x, WALL_HEIGHT / 2, z],
    args: [0.5, WALL_HEIGHT, 0.5],
  }));

  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[0.5, WALL_HEIGHT, 0.5]} />
      <meshStandardMaterial
        color="#000510"
        emissive="#ff00ff"
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.9}
      />
    </mesh>
  );
}

export function Arena() {
  // Wall dimensions [width, height, depth]
  const northSouthSize: Triplet = [
    ARENA_HALF * 2 + WALL_THICKNESS,
    WALL_HEIGHT,
    WALL_THICKNESS,
  ];
  const eastWestSize: Triplet = [
    WALL_THICKNESS,
    WALL_HEIGHT,
    ARENA_HALF * 2 + WALL_THICKNESS,
  ];

  return (
    <group data-ocid="arena.group">
      {/* Floor + ceiling */}
      <Floor />
      <FloorGrid />
      <Ceiling />

      {/* North wall (positive Z) */}
      <Wall
        position={[0, WALL_HEIGHT / 2, ARENA_HALF + WALL_THICKNESS / 2]}
        rotation={[0, 0, 0]}
        size={northSouthSize}
      />

      {/* South wall (negative Z) */}
      <Wall
        position={[0, WALL_HEIGHT / 2, -(ARENA_HALF + WALL_THICKNESS / 2)]}
        rotation={[0, 0, 0]}
        size={northSouthSize}
      />

      {/* East wall (positive X) */}
      <Wall
        position={[ARENA_HALF + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]}
        rotation={[0, 0, 0]}
        size={eastWestSize}
      />

      {/* West wall (negative X) */}
      <Wall
        position={[-(ARENA_HALF + WALL_THICKNESS / 2), WALL_HEIGHT / 2, 0]}
        rotation={[0, 0, 0]}
        size={eastWestSize}
      />

      {/* Corner accent pillars */}
      <CornerPillar x={ARENA_HALF} z={ARENA_HALF} />
      <CornerPillar x={-ARENA_HALF} z={ARENA_HALF} />
      <CornerPillar x={ARENA_HALF} z={-ARENA_HALF} />
      <CornerPillar x={-ARENA_HALF} z={-ARENA_HALF} />

      {/* Ambient lighting */}
      <ambientLight color="#0a0a1a" intensity={0.5} />

      {/* Cyan overhead point light */}
      <pointLight
        position={[0, 8, 0]}
        color="#00ffff"
        intensity={1.5}
        distance={30}
        castShadow
      />

      {/* Magenta accent lights at corners */}
      <pointLight
        position={[8, 2, 8]}
        color="#ff00ff"
        intensity={0.8}
        distance={15}
      />
      <pointLight
        position={[-8, 2, -8]}
        color="#ff00ff"
        intensity={0.8}
        distance={15}
      />

      {/* Dim cyan fill lights */}
      <pointLight
        position={[0, 2, -9]}
        color="#00ccff"
        intensity={0.4}
        distance={12}
      />
      <pointLight
        position={[0, 2, 9]}
        color="#00ccff"
        intensity={0.4}
        distance={12}
      />
    </group>
  );
}

export default Arena;
