# Wayfarer

A cozy learning feed you scroll like social media. Each card is a short field note about the natural world: sky, stars, rocks, ocean, forests, animals. You answer a question, get feedback right away, earn XP and coins, dress up a chibi traveler, and slowly turn a camper van into home.

```bash
npm install
npm run dev
```

## Product decisions

**Subject:** "Field Notes from the Road", the natural world you meet while traveling. It fits the van-life theme, demos well to any audience, and every topic has a scene that matches it. The content model (`src/data/cards.ts`) is topic-agnostic: add a topic and cards and the feed, mastery tracker and achievements pick them up.

**Core loop:** scroll a card → read a 2–3 sentence explanation → answer → see why → +XP and coins → spend them in the closet or on van upgrades → review shaky concepts → plant grows, trophies fill the shelf.

**Screens:** Learn (feed with Discover / Review / Saved) · Closet · Van · Profile. A first-run welcome screen asks girl or guy, and a name.

## UX principles

- **Mobile-first.** Built for phone widths first; desktop shows the same column, centered. Tap targets are at least 44px.
- **One action, one thing.** No step should take two gestures when one will do:
  - A Learn card always fits the screen with no inner scrolling. Scrolling moves to the next card.
  - After you answer, the explanation replaces the reading text in the same space and the wrong choices collapse, so the card never grows. On short phones the text shrinks slightly (down to about 12px) instead of scrolling.
  - In the closet, tapping something you own wears it immediately. Tapping something locked tries it on with an Unlock button, because spending coins stays a deliberate second tap.

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

- **Palette:** plum dusk `#221a33` for the app shell, cream `#fbf3e6` for card content, van lavender `#b9a7f2`, butter `#f5cd6a` for coins and rewards, sage for correct and coral for wrong. Rarity colors are sage / sky / lavender / gold.
- **Type:** Fredoka for headings (rounded, like the clay figurines), Nunito for UI text. Labels are sentence case, not tracked capitals.
- **Material:** every panel is `.clay` (top highlight, darker lip, short shadow). Primary actions are `.clay-btn`, which presses down 3px on tap. The sliding nav highlight is `.clay-pill`, with no CSS transform transition so it doesn't fight Framer's layout animation.
- **Motion:** Framer Motion for rewards, toasts, level-up and tab transitions. Ambient CSS loops for blinking, idle bob, cat tail, plant sway and fire flicker, all turned off under `prefers-reduced-motion`.

## Artwork

The Home screen, character and companions use **pre-rendered 2.5D artwork**: AI-generated isometric renders placed as layered images. There is **no real-time 3D engine**. Everything you see is a flat image with depth baked into the render. Placement, draw order, contact shadows and selection glow are handled in React.

### What's rendered vs. drawn

| Rendered images (`src/assets/art/`) | Still SVG (`src/art/`) |
| --- | --- |
| 4 van room states (Bare → Cozy → Lived-in → Dream), 3 exterior dioramas | Feed card landscapes |
| 24 figurines: 2 body types × 2 hairstyles × 6 outfits | Icons and trophies |
| Extras baked into figurine renders (in progress, see below) | Small icons in toasts and feed feedback |
| Mochi and 5 plant stages (Home cards) | Fallbacks for any missing render |

### How the character works

- **Body × hairstyle × outfit** is one full-body render per combination: girl (Soft Bob, High Ponytail) and guy (Messy Crop, Wolf Cut). Every prompt shares one word-for-word character description, so face, proportions, pose and lighting stay consistent. Outfits aren't gender-locked: all six exist for both bodies.
- **Hair color** isn't a separate render. The art script extracts a hair mask from each figurine (dark indigo pixels connected to the top of the head, stopping below the chin so navy collars aren't included). At runtime `Figurine.tsx` recolors only those pixels on a canvas, keeping the render's shading and mapping its brightness onto the new palette. Results are cached per figurine and color.
- **Extras are baked into the render** (`fig-<body>-<hair>-<outfit>-<extra>`). Layering a separate glasses or hat image on top always looked stuck on, so each extra gets rendered *with* the character. That's 96 renders (24 figurines × 4 extras).
  - **Status:** 85 of 96 are done. Missing: guy · Wolf Cut with headphones (Courier, Tidecaller, Keeper, Starlit, Nocturne) and with the ranger hat (all 6 outfits). AICreate's free tier has an hourly image budget.
  - Until a combination is baked, the app falls back to the old overlay (a separate extra image placed using measured face anchors), so nothing goes missing. Each new render replaces its overlay automatically after `npm run art`.
- **The profile icon** is a head crop of the same figurine (`Avatar`), framed from the face box so hats and ponytails don't throw it off.
- **Save data:** `look.body` is new (defaults to girl). Hairstyles belong to one body; switching body falls back to that body's free style. Twin Buns was retired and refunded (80 coins) for anyone who owned it.

### Pipeline

1. **Generate:** AICreate `generate_image` (FLUX, free, no account; AICreate keeps prompts and images). Sprites go on a flat magenta screen, or green for plum or purple subjects. Dioramas go on a light-grey studio backdrop. Prompts are in [`art-src/PROMPTS.md`](art-src/PROMPTS.md).
2. **Save raw:** copy the render into `art-src/raw/<name>.png`. WebP raws work too, and that's how they're committed (about 2 MB in total).
3. **Process:** `npm run art` (or `npm run art -- cat`). [`scripts/process-art.mjs`](scripts/process-art.mjs) uses `sharp` to:
   - shave the generator's edge vignette;
   - chroma-key only screen regions connected to the border, plus large enclosed gaps, so lavender or plum *inside* a figure survives;
   - despill an 8px rim band (or the whole sprite for green-screened figures and props with no real greens);
   - trim to bounds and export WebP into `src/assets/art/`;
   - for figurines, also write `<name>-hair.webp` (hair mask) and face/hair boxes into `anchors.json`.
4. **Place:** `src/scene/assets.ts` picks up every file in `src/assets/art/` by name, so new art needs no imports. Missing art falls back to the SVG version.

### The van

The van is a **sequence of complete room renders**, not a room with objects layered on top. Separately rendered props never looked placed: they had no shared lighting or occlusion, and nothing could sit behind the bed. So each upgrade is a whole new picture with everything, including Mochi asleep on the bed, painted in place:

| Tier | Item | Cost | What it adds |
| --- | --- | --- | --- |
| 0 · Bare Van | — | free | bed, kitchenette, Mochi |
| 1 · Cozy Nest | `van-cozy` | 40 | string lights, rug, pastel pillows, bunting |
| 2 · Lived-in | `van-livedin` | 180 | books, reading chair, paper lanterns, telescope |
| 3 · Dream Van | `van-dream` | 320 | wood stove, surfboards, maps, plants everywhere |

- Upgrades unlock in order with one tap.
- Your figurine stands on the stage floor beside the diorama, like a display figure next to a dollhouse, rather than being pasted inside it. Tapping it opens the closet.
- **Why not real-time 3D for free placement:** it was considered and set aside for mobile. It brings engine and model downloads, battery and heat, a lower-detail look at phone size, and drag gestures that fight page scrolling.
- **Save migration:** the six old individual decorations are removed and refunded in full.

```
src/scene/
  VanExterior.tsx destination diorama
  Figurine.tsx    figurine render (baked extra if available), runtime hair recolor, overlay fallback, Avatar crop
  stage.ts        stage colours sampled from each render's backdrop + edge feather
  assets.ts       picks up every file in src/assets/art/ by name
```

### Limitations

- These are static renders: no free placement, camera movement or walk-through. The van changes by whole-room upgrades.
- Each room tier is a separate generation, so furniture positions change between tiers. It reads as a renovation, but it isn't the same room gaining items.
- The plant's growth lives in its own card, since the generator can't redraw the same room with only the plant changed.
- The figurine has one pose and no expressions.
- 11 of 96 baked extras are still missing (guy · Wolf Cut headphones and hats). Those combinations fall back to the overlay and look stuck on.
- Hair recoloring maps brightness onto a palette. Very light colors (Snow) read slightly grey in shadowed strands.
- AICreate's free tier limits images per hour, which makes big asset batches slow.

## Structure

```
src/
  data/        cards, items (cosmetics, van upgrades, destinations), achievements
  state/       game.ts (pure rules), storage.ts (save adapter), store.tsx (React context)
  scene/       rendered 2.5D van interior/exterior, figurine, slot layout
  assets/art/  processed WebP renders (generated by npm run art)
  art/         SVG portrait sticker, landscapes, fallbacks
  components/  HUD, nav, toasts/level-up, onboarding, icons, trophy
  screens/     Feed, Closet, Home (van), Profile
art-src/       raw renders + prompt log
scripts/       process-art.mjs
```

**Persistence:** `localStorage` key `wayfarer.save.v1`, behind the `SaveAdapter` interface in `state/storage.ts`. A Supabase adapter can implement the same `load`/`save`, and `game.ts` has no React or storage dependencies, so the rules can move server-side unchanged.

**Keyboard:** `1–4` answers the visible card, `J`/`K` or the arrow keys move between cards, `Esc` closes the level-up dialog.
