import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";

// ─── Crosshair ───────────────────────────────────────────────────────────────
function Crosshair() {
  return (
    <div
      data-ocid="hud.crosshair"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 110,
        width: 24,
        height: 24,
      }}
    >
      {/* Horizontal bar */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1.5,
          marginTop: -0.75,
          background: "rgba(255,255,255,0.9)",
          boxShadow:
            "0 0 6px oklch(0.78 0.18 195), 0 0 12px oklch(0.78 0.18 195 / 0.5)",
        }}
      />
      {/* Vertical bar */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: 1.5,
          marginLeft: -0.75,
          background: "rgba(255,255,255,0.9)",
          boxShadow:
            "0 0 6px oklch(0.78 0.18 195), 0 0 12px oklch(0.78 0.18 195 / 0.5)",
        }}
      />
      {/* Center dot */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 3,
          height: 3,
          marginTop: -1.5,
          marginLeft: -1.5,
          borderRadius: "50%",
          background: "rgba(255,255,255,1)",
          boxShadow: "0 0 8px oklch(0.78 0.18 195)",
        }}
      />
    </div>
  );
}

// ─── Health Bar ───────────────────────────────────────────────────────────────
function HealthBar({ health }: { health: number }) {
  const pct = Math.max(0, Math.min(100, health));
  const barColor =
    pct > 50
      ? "oklch(0.65 0.22 25)"
      : pct > 25
        ? "oklch(0.68 0.22 20)"
        : "oklch(0.62 0.24 15)";
  const barGlow =
    pct > 50
      ? "0 0 8px oklch(0.65 0.22 25 / 0.8)"
      : "0 0 10px oklch(0.68 0.22 20 / 0.9)";

  return (
    <div
      data-ocid="hud.health_panel"
      className="hud-panel"
      style={{
        position: "absolute",
        top: "1.5rem",
        left: "1.5rem",
        padding: "0.6rem 1rem",
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.25em",
          color: "oklch(0.78 0.18 195)",
          marginBottom: "0.35rem",
          textShadow: "0 0 8px oklch(0.78 0.18 195 / 0.7)",
          fontFamily: "var(--font-mono)",
        }}
      >
        HP
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <div
          style={{
            flex: 1,
            height: 6,
            background: "oklch(0.18 0.04 265)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            data-ocid="hud.health_bar"
            style={{
              width: `${pct}%`,
              height: "100%",
              background: barColor,
              boxShadow: barGlow,
              transition: "width 0.25s ease, background 0.3s ease",
            }}
          />
        </div>
        <span
          data-ocid="hud.health_value"
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: pct > 25 ? "oklch(0.92 0.04 195)" : "oklch(0.65 0.22 25)",
            minWidth: "2.2rem",
            textAlign: "right",
            letterSpacing: "0.05em",
          }}
        >
          {health}
        </span>
      </div>
    </div>
  );
}

// ─── Ammo Counter ─────────────────────────────────────────────────────────────
function AmmoCounter({
  ammo,
  maxAmmo,
  reserveAmmo,
}: {
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
}) {
  const isEmpty = ammo === 0;
  const ammoColor = isEmpty ? "oklch(0.65 0.22 25)" : "oklch(0.78 0.18 195)";
  const ammoGlow = isEmpty
    ? "0 0 10px oklch(0.65 0.22 25 / 0.8)"
    : "0 0 8px oklch(0.78 0.18 195 / 0.7)";

  return (
    <div
      data-ocid="hud.ammo_panel"
      className="hud-panel"
      style={{
        position: "absolute",
        top: "1.5rem",
        right: "1.5rem",
        padding: "0.6rem 1rem",
        minWidth: 160,
        textAlign: "right",
      }}
    >
      <div
        style={{
          fontSize: "0.6rem",
          letterSpacing: "0.25em",
          color: "oklch(0.78 0.18 195)",
          marginBottom: "0.35rem",
          textShadow: "0 0 8px oklch(0.78 0.18 195 / 0.7)",
          fontFamily: "var(--font-mono)",
        }}
      >
        AMMO
      </div>
      <div
        data-ocid="hud.ammo_value"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "1.5rem",
          fontWeight: 900,
          letterSpacing: "0.05em",
          lineHeight: 1,
          color: ammoColor,
          textShadow: ammoGlow,
        }}
      >
        {ammo}
        <span
          style={{
            fontSize: "0.8rem",
            color: "oklch(0.5 0.04 220)",
            fontWeight: 400,
            marginLeft: "0.25rem",
          }}
        >
          / {maxAmmo}
        </span>
      </div>
      <div
        style={{
          fontSize: "0.55rem",
          letterSpacing: "0.15em",
          color: "oklch(0.45 0.04 220)",
          marginTop: "0.25rem",
          fontFamily: "var(--font-mono)",
        }}
      >
        RES: {reserveAmmo}
      </div>
      {isEmpty && (
        <div
          data-ocid="hud.ammo_empty_state"
          style={{
            fontSize: "0.55rem",
            letterSpacing: "0.2em",
            color: "oklch(0.65 0.22 25)",
            marginTop: "0.25rem",
            textShadow: "0 0 6px oklch(0.65 0.22 25)",
            fontFamily: "var(--font-mono)",
            animation: "hudBlink 1s step-end infinite",
          }}
        >
          RELOAD [R]
        </div>
      )}
    </div>
  );
}

// ─── Score Counter ────────────────────────────────────────────────────────────
function ScoreCounter({ score }: { score: number }) {
  return (
    <div
      data-ocid="hud.score_panel"
      style={{
        position: "absolute",
        top: "1.5rem",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      <div
        data-ocid="hud.score_value"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(0.8rem, 1.5vw, 1.1rem)",
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: "oklch(0.78 0.18 195)",
          textShadow:
            "0 0 8px oklch(0.78 0.18 195), 0 0 20px oklch(0.78 0.18 195 / 0.5)",
        }}
      >
        ⚡ SCORE: {score.toString().padStart(6, "0")}
      </div>
    </div>
  );
}

// ─── Damage Flash ─────────────────────────────────────────────────────────────
function DamageFlash({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-ocid="hud.damage_flash"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 105,
        background: "oklch(0.55 0.22 25 / 0.35)",
        opacity: active ? 1 : 0,
        transition: active ? "opacity 0s" : "opacity 0.3s ease-out",
      }}
    />
  );
}

// ─── HUD Root ─────────────────────────────────────────────────────────────────
export function HUD() {
  const { health, score, ammo, maxAmmo, reserveAmmo, isPlaying, isGameOver } =
    useGameStore();

  const [damageFlash, setDamageFlash] = useState(false);
  const [flickerActive, setFlickerActive] = useState(false);
  const prevHealthRef = useRef(health);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect damage and trigger flash + flicker
  useEffect(() => {
    if (health < prevHealthRef.current) {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setDamageFlash(true);
      setFlickerActive(true);
      flashTimerRef.current = setTimeout(() => {
        setDamageFlash(false);
        setFlickerActive(false);
      }, 300);
    }
    prevHealthRef.current = health;
  }, [health]);

  if (!isPlaying || isGameOver) return null;

  return (
    <>
      {/* Flicker overlay on damage */}
      <div
        aria-hidden="true"
        data-ocid="hud.flicker_overlay"
        className={flickerActive ? "hud-screen-flicker" : ""}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 104,
        }}
      />

      {/* Damage flash overlay */}
      <DamageFlash active={damageFlash} />

      {/* Main HUD layer */}
      <div
        data-ocid="hud.panel"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 100,
          fontFamily: "var(--font-display)",
        }}
      >
        {/* CRT scanlines */}
        <div
          className="scanlines"
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, opacity: 0.25, zIndex: 1 }}
        />

        <HealthBar health={health} />
        <ScoreCounter score={score} />
        <AmmoCounter ammo={ammo} maxAmmo={maxAmmo} reserveAmmo={reserveAmmo} />
        <Crosshair />
      </div>
    </>
  );
}
