export interface Enemy {
  id: string;
  position: [number, number, number];
  alive: boolean;
}

export interface GameState {
  health: number;
  score: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  isGameOver: boolean;
  isPlaying: boolean;
  enemies: Enemy[];
}

export interface GameActions {
  takeDamage: (amount: number) => void;
  addScore: (points: number) => void;
  shoot: () => void;
  reload: () => void;
  killEnemy: (id: string) => void;
  spawnEnemy: (enemy: Enemy) => void;
  startGame: () => void;
  resetGame: () => void;
  setEnemies: (enemies: Enemy[]) => void;
}
