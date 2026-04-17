import { create } from "zustand";
import type { Enemy, GameActions, GameState } from "../types/game";

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  // State
  health: 100,
  score: 0,
  ammo: 30,
  maxAmmo: 30,
  reserveAmmo: 60,
  isGameOver: false,
  isPlaying: false,
  enemies: [],

  // Actions
  takeDamage: (amount: number) => {
    const { health } = get();
    const newHealth = Math.max(0, health - amount);
    set({ health: newHealth, isGameOver: newHealth <= 0 });
  },

  addScore: (points: number) => {
    set((state) => ({ score: state.score + points }));
  },

  shoot: () => {
    const { ammo, isGameOver } = get();
    if (isGameOver || ammo <= 0) return;
    set({ ammo: ammo - 1 });
  },

  reload: () => {
    const { ammo, maxAmmo, reserveAmmo } = get();
    if (reserveAmmo <= 0) return;
    const needed = maxAmmo - ammo;
    const toReload = Math.min(needed, reserveAmmo);
    set({ ammo: ammo + toReload, reserveAmmo: reserveAmmo - toReload });
  },

  killEnemy: (id: string) => {
    set((state) => ({
      enemies: state.enemies.map((e) =>
        e.id === id ? { ...e, alive: false } : e,
      ),
      score: state.score + 10,
    }));
  },

  spawnEnemy: (enemy: Enemy) => {
    set((state) => ({ enemies: [...state.enemies, enemy] }));
  },

  startGame: () => {
    set({
      health: 100,
      score: 0,
      ammo: 30,
      maxAmmo: 30,
      reserveAmmo: 60,
      isGameOver: false,
      isPlaying: true,
      enemies: [],
    });
  },

  resetGame: () => {
    set({
      health: 100,
      score: 0,
      ammo: 30,
      maxAmmo: 30,
      reserveAmmo: 60,
      isGameOver: false,
      isPlaying: false,
      enemies: [],
    });
  },

  setEnemies: (enemies: Enemy[]) => {
    set({ enemies });
  },
}));
