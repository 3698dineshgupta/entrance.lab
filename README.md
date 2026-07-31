# EntranceLab — IOE & CEE Mock Test Platform

A modern, responsive mock-test platform for Nepalese IOE Engineering Entrance and CEE Medical Entrance students. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui primitives, Framer Motion, Recharts, and an interactive Spline 3D hero scene.

## Features

- **Hero section** with the supplied Spline 3D scene (lazy-loaded, client-only, with animated loader and Spotlight effect)
- **Exam selection modal** — IOE or CEE, full mock or subject-wise, difficulty selector
- **Mock tests catalogue** with filters
- **Distraction-free test interface**: countdown timer, progress bar, question navigator (answered / unanswered / current / marked), keyboard shortcuts (←/→ to navigate, 1–4 to answer), mark for review, submit confirmation, auto-submit on time-out, `beforeunload` guard
- **Results page**: score, %, accuracy, subject-wise chart (Recharts), full answer review with explanations
- **Dashboard**: recent attempts, average score, strongest/weakest subject
- **Auth-ready** login & signup screens with a "Continue as guest" option
- Clean dark navy theme, glassmorphism cards, subtle animations, Inter typography, fully responsive, accessible

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Adding the shadcn Spline component

The user's instruction referenced:
```
npx shadcn@latest add "https://21st.dev/r/serafimcloud/splite"
```
That component is already included at `components/ui/splite.tsx`. If you'd like to re-fetch it via the shadcn CLI, first initialise shadcn (`npx shadcn@latest init`) then run the command above.

## Project structure

```
app/
  page.tsx                # Home (Hero + Exam cards + Stats)
  mock-tests/page.tsx     # Test catalogue
  test/[id]/page.tsx      # Live test interface
  results/page.tsx        # Post-test analytics
  dashboard/page.tsx      # Student dashboard
  login, signup           # Auth-ready screens
components/
  ui/                     # shadcn primitives (Button, Card, Dialog, Progress, Input, Label, RadioGroup, Spotlight, SplineScene)
  navbar.tsx, footer.tsx
  hero.tsx, exam-cards.tsx, stats-section.tsx
  exam-selection-modal.tsx
  test-interface.tsx
lib/
  types.ts                # TypeScript interfaces
  questions.ts            # Sample question bank + exam metadata
  utils.ts
```

## Connecting a backend

The data layer in `lib/questions.ts` returns typed `MockTest` and `Question` objects. Replace the static arrays with calls to Supabase (or any REST/GraphQL API) — the components consume the same shape.

## License

MIT
