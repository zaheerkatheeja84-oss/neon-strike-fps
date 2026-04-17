# Design Brief: Cyberpunk FPS Arena

**Concept:** Neon-lit 3D FPS arena with deep charcoal background, cyan environment glow, magenta enemy highlights, minimal HUD overlay.

**Tone:** Cyberpunk-futuristic, high-tech, stark, cold precision.

**Differentiation:** Vibrant neon color palette (cyan walls, magenta enemies) as the signature visual system; minimalist gameplay HUD; sharp geometry; no blur or soft elements.

## Palette

| Token | OKLCH | Purpose |
|-------|-------|---------|
| background | 0.06 0 0 | Deep charcoal arena floor/void |
| foreground | 0.95 0 0 | HUD text, readouts |
| primary | 0.7 0.22 262 | Cyan neon — walls, environment lights |
| secondary | 0.65 0.2 320 | Magenta neon — enemies, danger accents |
| accent | 0.7 0.22 262 | Cyan highlights on active UI elements |
| destructive | 0.55 0.22 25 | Red damage/critical state |
| muted | 0.2 0 0 | Dark mid-tone borders, subtle UI |
| border | 0.2 0 0 | Sharp edges, sharp contrast |

## Typography

| Layer | Font | Usage |
|-------|------|-------|
| Display | General Sans, 500 weight | HUD titles, score headings |
| Body | General Sans, 400 weight | HUD text, status readouts |
| Mono | Geist Mono, 400 weight | Ammo counter, debug/tech elements |

**Scale:** 12px base (xs), 14px (sm), 16px (base), 20px (lg), 24px (xl).

## Elevation & Depth

**No layers.** Game canvas fills full viewport; HUD elements overlay directly on game rendering with z-index stacking. No cards, no background colors outside game — render area is the only surface.

## Structural Zones

| Zone | Treatment | Z-Index |
|------|-----------|---------|
| Game Canvas | Full viewport, Three.js render target | 0 |
| HUD Score (top-right) | Neon cyan text with minimal padding, transparent background | 10 |
| HUD Ammo (bottom-center) | Neon magenta text with transparent background | 10 |
| Crosshair (center) | Cyan vector outline, sharp 1px lines | 20 |

## Spacing & Rhythm

- **Padding:** 12px (xs), 16px (sm), 24px (md) — used only in HUD labels if needed
- **Gap:** No grid; items position absolutely over game canvas
- **Density:** Minimal — only essential info visible (health, ammo, score)

## Component Patterns

- **HUD Text:** `.hud-text` utility — `font-mono text-xs tracking-widest uppercase`
- **Neon Highlight:** `.neon-cyan` or `.neon-magenta` color tokens via text/border classes
- **Glow:** `shadow-neon-cyan` / `shadow-neon-magenta` for emphasis on HUD elements
- **Animation:** `animate-neon-pulse-cyan` / `animate-neon-pulse-magenta` for pulsing effects (health bars, warning states)

## Motion & Interaction

- **Crosshair:** No animation; instantly tracks input
- **Hit feedback:** 150ms cyan flash on successful shot
- **Damage taken:** Red damage indicator, 200ms fade-out
- **Ammo low:** Neon magenta pulse animation at < 20% ammo
- **Health warning:** Red pulse when < 30% health

## Constraints

1. No drop shadows or soft effects outside the neon glow system
2. Game canvas fill entire viewport; no scrollbars
3. HUD must maintain > 4.5:1 contrast (neon colors against dark background already meet this)
4. No rounded corners (--radius: 0) — sharp geometric lines only
5. No decorative elements; every visual element serves game feedback

## Signature Detail

**Neon glow on active HUD elements** — when player takes damage, gets low on ammo, or defeats an enemy, the corresponding HUD value pulses with its neon color (cyan for ammo, magenta for danger states). Creates visceral, reactive feedback loop tied directly to the cyberpunk aesthetic.
