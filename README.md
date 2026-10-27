# Wayfarer

A cozy learning feed you scroll like social media. Each card is a short field note about the natural world: sky, stars, rocks, ocean, forests, animals. You answer a question, get feedback right away, earn XP and coins, dress up a chibi traveler, and slowly turn a camper van into home.

```bash
npm install
npm run dev
```

## Product decisions

**Subject:** "Field Notes from the Road", the natural world you meet while traveling. It fits the van-life theme, demos well to any audience, and every topic has a scene that matches it. The content model (`src/data/cards.ts`) is topic-agnostic: add a topic and cards and the feed, mastery tracker and achievements pick them up.

**Core loop:** scroll a card → read a 2–3 sentence explanation → answer → see why → +XP and coins → spend them in the closet or on van decor → review shaky concepts → plant grows, trophies fill the shelf.

**Screens:** Learn (feed with Discover / Review / Saved) · Closet · Van · Profile. A first-run welcome screen asks for a name.

## Economy (deterministic, single currency)

| Card status → answer | Right | Wrong |
| --- | --- | --- |
| New | +20 XP, +10 coins → Familiar | +5 XP → Learning |
| Learning (review) | +12 XP, +6 coins → Familiar | +3 XP |
| Familiar (review) | +15 XP, +8 coins → **Mastered** | +3 XP → Learning |
| Mastered (practice) | +3 XP | +2 XP → Familiar |

- Level *L* needs `50·L·(L−1)` total XP (100, 300, 600, 1000…). Levels unlock destinations: Saltwind Cliffs (Lv 2) and Starfall Mesa (Lv 4).
- The plant gets 1 growth point per Familiar concept and 3 per Mastered one. Its stages are Seed → Sprout → Sapling → Leafy → Blooming.
- Achievements give a one-time coin bonus and a wearable title.
- No streaks, timers, loot boxes or daily chores.

## Design system

- **Palette:** dusk ink `#1b1f3b` for the app shell, warm paper `#fdf3e7` for card content, with peach, gold, lavender, sage, sky and coral accents. Rarity colors are sage / sky / lavender / gold.
- **Type:** Fraunces for display headings, Nunito for UI text.
- **Shapes:** large radii (24–30px), soft glows, film-grain overlay on scenes.
- **Motion:** Framer Motion for rewards, toasts, level-up and tab transitions. Ambient CSS loops for blinking, idle bob, cat tail, plant sway and fire flicker, all turned off under `prefers-reduced-motion`.

## Assets

All art is original inline SVG in `src/art/`, so there are no image files:

- `Character.tsx`: layered chibi (hair back → outfit → head → face → hair front → accessory). Outfit, hair, hair color and accessory are real independent slots, so mix-and-match already works.
- `Landscape.tsx`: six painterly scenes shared by cards, destinations and banners.
- `VanScene.tsx`: the van plus decor placements. `Companions.tsx`: Mochi the cat and the 5-stage plant.

These are polished placeholders. To swap in illustrated art later, keep the component APIs and replace their SVG bodies with `<image>` layers.

## Structure

```
src/
  data/        cards, items (cosmetics, decor, destinations), achievements
  state/       game.ts (pure rules), storage.ts (save adapter), store.tsx (React context)
  art/         SVG character, landscapes, van, cat, plant
  components/  HUD, nav, toasts/level-up, onboarding, icons, trophy
  screens/     Feed, Closet, Home (van), Profile
```

**Persistence:** `localStorage` key `wayfarer.save.v1`, behind the `SaveAdapter` interface in `state/storage.ts`. A Supabase adapter can implement the same `load`/`save`, and `game.ts` has no React or storage dependencies, so the rules can move server-side unchanged.

**Keyboard:** `1–4` answers the visible card, `J`/`K` or the arrow keys move between cards, `Esc` closes the level-up dialog.
