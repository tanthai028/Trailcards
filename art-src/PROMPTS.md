# Art prompts

The raw render in `raw/` came from AICreate's `generate_image` tool (FLUX), on 2026-10-27. FLUX doesn't give the same image twice from the same prompt, so these prompts are a style guide for matching new assets, not a way to rebuild the old ones.

## Shared style

Every prompt ends with the same style block:

> Isometric 3D render, miniature collectible diorama prop, soft clay-like materials, pastel cozy palette, soft studio lighting from the top left, gentle ambient occlusion, cute indie game asset. Single object, centered and fully visible.

**Sprites** add:

> Background is a perfectly flat solid pure magenta color (#FF00FF), no floor, no cast shadow, no text.

Use green (`#00FF00`) instead for anything plum, purple or magenta, and set `screen: 'green'` in `scripts/process-art.mjs`.

## Mochi

Mochi uses a warm room camera and light instead of the studio style above:

> Isometric 3D render viewed from high above at a 35-degree downward angle, three-quarter view from the front-right, the same camera as an isometric dollhouse room. Warm golden interior lighting, soft warm shadows, slightly hazy soft focus, gentle ambient occlusion, soft clay-like materials.

| File | Subject |
| --- | --- |
| cat | chubby cream-and-orange tabby curled asleep in a loaf *(green screen)* |
