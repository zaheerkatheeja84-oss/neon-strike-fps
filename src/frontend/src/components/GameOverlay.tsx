import { useEffect } from "react";
import type React from "react";
import { useGameStore } from "../store/gameStore";

// ─── Neon Button ──────────────────────────────────────────────────────────────
interface NeonButtonProps {
  label: string;
  color: "cyan" | "magenta";
  onClick: () => void;
  ocid: string;
}

function NeonButton({ label, color, onClick, ocid }: NeonButtonProps) {
  const c =
    color === "cyan"
      ? {
          text: "oklch(0.78 0.18 195)",
          border: "oklch(0.78 0.18 195)",
          glow: "oklch(0.78 0.18 195 / 0.45)",
          glowHover: "oklch(0.78 0.18 195 / 0.75)",
          bgHover: "oklch(0.78 0.18 195 / 0.1)",
        }
      : {
          text: "oklch(0.72 0.22 330)",
          border: "oklch(0.72 0.22 330)",
          glow: "oklch(0.72 0.22 330 / 0.45)",
          glowHover: "oklch(0.72 0.22 330 / 0.75)",
          bgHover: "oklch(0.72 0.22 330 / 0.1)",
        };

  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      style={{
        padding: "0.85rem 3.5rem",
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.3em",
        background: "transparent",
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 0,
        cursor: "pointer",
        boxShadow: `0 0 14px ${c.glow}, inset 0 0 14px ${c.glow.replace("0.45", "0.06")}`,
        transition: "all 0.18s ease",
        fontFamily: "var(--font-mono)",
        textTransform: "uppercase",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = c.bgHover;
        el.style.boxShadow = `0 0 28px ${c.glowHover}, inset 0 0 20px ${c.glowHover.replace("0.75", "0.12")}`;
        el.style.transform = "scale(1.02)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "transparent";
        el.style.boxShadow = `0 0 14px ${c.glow}, inset 0 0 14px ${c.glow.replace("0.45", "0.06")}`;
        el.style.transform = "scale(1)";
      }}
    >
      {label}
    </button>
  );
}

// ─── Corner Decoration ────────────────────────────────────────────────────────
function CornerAccents({ color }: { color: string }) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: 18,
    height: 18,
    borderStyle: "solid",
    borderColor: color,
    borderWidth: 0,
    opacity: 0.7,
  };
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          ...base,
          top: -1,
          left: -1,
          borderTopWidth: 2,
          borderLeftWidth: 2,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...base,
          top: -1,
          right: -1,
          borderTopWidth: 2,
          borderRightWidth: 2,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...base,
          bottom: -1,
          left: -1,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...base,
          bottom: -1,
          right: -1,
          borderBottomWidth: 2,
          borderRightWidth: 2,
        }}
      />
    </>
  );
}

// ─── Game Over Screen ─────────────────────────────────────────────────────────
function GameOverScreen({
  score,
  onRestart,
}: {
  score: number;
  onRestart: () => void;
}) {
  return (
    <>
      <div
        data-ocid="game.over_title"
        style={{
          fontSize: "clamp(3rem, 9vw, 6rem)",
          fontWeight: 900,
          color: "oklch(0.72 0.22 330)",
          letterSpacing: "0.15em",
          lineHeight: 1,
          textShadow:
            "0 0 12px oklch(0.72 0.22 330), 0 0 40px oklch(0.72 0.22 330 / 0.5)",
          fontFamily: "var(--font-mono)",
          animation: "gameOverGlitch 4s infinite",
          marginBottom: "0.75rem",
        }}
      >
        GAME OVER
      </div>

      <div
        aria-hidden="true"
        style={{
          width: "80%",
          maxWidth: 320,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, oklch(0.72 0.22 330 / 0.6), transparent)",
          margin: "0 auto 1.5rem",
        }}
      />

      <div
        data-ocid="game.final_score"
        style={{
          fontSize: "clamp(1rem, 2vw, 1.25rem)",
          letterSpacing: "0.25em",
          color: "oklch(0.55 0.04 220)",
          marginBottom: "2.5rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        SCORE:{" "}
        <span
          style={{
            color: "oklch(0.78 0.18 195)",
            textShadow:
              "0 0 8px oklch(0.78 0.18 195), 0 0 20px oklch(0.78 0.18 195 / 0.5)",
          }}
        >
          {score.toString().padStart(6, "0")}
        </span>
      </div>

      <NeonButton
        label="RESTART [ R ]"
        color="cyan"
        onClick={onRestart}
        ocid="game.restart_button"
      />

      <div
        style={{
          marginTop: "1.5rem",
          fontSize: "0.6rem",
          letterSpacing: "0.3em",
          color: "oklch(0.35 0.04 220)",
          fontFamily: "var(--font-mono)",
        }}
      >
        OR PRESS R TO RESTART
      </div>
    </>
  );
}

// ─── Start Screen ─────────────────────────────────────────────────────────────
const CONTROLS: [string, string][] = [
  ["WASD", "MOVE"],
  ["MOUSE", "AIM"],
  ["LMB", "SHOOT"],
  ["R", "RELOAD"],
  ["SPACE", "JUMP"],
];

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div
        data-ocid="game.title"
        style={{
          fontSize: "clamp(2.5rem, 8vw, 5.5rem)",
          fontWeight: 900,
          color: "oklch(0.78 0.18 195)",
          letterSpacing: "0.2em",
          lineHeight: 1,
          textShadow:
            "0 0 12px oklch(0.78 0.18 195), 0 0 40px oklch(0.78 0.18 195 / 0.5)",
          fontFamily: "var(--font-mono)",
          marginBottom: "0.3rem",
        }}
      >
        NEON STRIKE
      </div>

      <div
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.5em",
          color: "oklch(0.55 0.04 220)",
          marginBottom: "3rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        CYBERPUNK FPS
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "0.4rem 1rem",
          marginBottom: "3rem",
          color: "oklch(0.5 0.06 220)",
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          fontFamily: "var(--font-mono)",
          textAlign: "left",
        }}
      >
        {CONTROLS.map(([key, action]) => (
          <div key={key} style={{ display: "contents" }}>
            <span
              style={{
                color: "oklch(0.78 0.18 195)",
                textShadow: "0 0 6px oklch(0.78 0.18 195 / 0.5)",
                textAlign: "right",
              }}
            >
              {key}
            </span>
            <span>{action}</span>
          </div>
        ))}
      </div>

      <NeonButton
        label="START GAME"
        color="cyan"
        onClick={onStart}
        ocid="game.start_button"
      />
    </>
  );
}

// ─── GameOverlay Root ─────────────────────────────────────────────────────────
export function GameOverlay() {
  const { isGameOver, isPlaying, score, startGame, resetGame } = useGameStore();

  const visible = !isPlaying || isGameOver;

  // R key: restart when game over
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === "r" || e.key === "R") && isGameOver) {
        resetGame();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isGameOver, resetGame]);

  if (!visible) return null;

  return (
    <div
      data-ocid="game.overlay"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.06 0.02 265 / 0.93)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
      }}
    >
      {/* CRT scanlines */}
      <div
        className="scanlines"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, opacity: 0.4 }}
      />

      {/* Content card */}
      <div
        data-ocid="game.overlay_card"
        style={{
          position: "relative",
          textAlign: "center",
          padding: "3rem 4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <CornerAccents color="oklch(0.78 0.18 195 / 0.5)" />

        {isGameOver ? (
          <GameOverScreen score={score} onRestart={resetGame} />
        ) : (
          <StartScreen onStart={startGame} />
        )}
      </div>
    </div>
  );
}
