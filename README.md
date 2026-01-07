# Relationship Simulator

A game theory-based social simulation where players create a character and watch relationships form, evolve, and collapse within a population.

## Mission

Build an interactive simulation inspired by Conway's Game of Life, but for human relationships. Instead of cells living or dying based on neighbor counts, characters form friendships, rivalries, and romantic partnerships based on game theory dynamics (Prisoner's Dilemma, matching markets, evolutionary strategies).

The core question: **Can you create a character that maintains stable relationships, or is instability inevitable?**

## Key Concepts

- **Social Graph**: Characters are nodes, relationships are edges. No physical grid—"neighbors" are social connections.
- **Game Theory Dynamics**: Modular system of rules (cooperate/defect, preference matching, etc.) that can be toggled and tuned.
- **Fixed Strategies**: Characters have behavioral strategies (cooperator, defector, tit-for-tat, etc.) that determine their actions.
- **Player Agency**: You make strategic relationship decisions each turn—who to pursue, maintain, or distance from.

## Tech Stack

- Next.js + TypeScript + Tailwind
- Pixi.js (16-bit style graphics)
- Zustand (state management)
- Neon (Postgres database)
- Vercel Blob (asset storage)

## Project Structure

```
src/
├── simulation/     # Core engine (characters, graph, dynamics)
├── components/     # UI (canvas, panels, controls)
├── lib/            # Utilities (db, store)
└── app/            # Next.js pages
sql/                # Database schema
```

## Development

```bash
npm install
npm run dev
```

Pull environment variables from Vercel:
```bash
vercel env pull .env.local
```

## Planning

See `/.claude/plans/` for detailed implementation plans.
