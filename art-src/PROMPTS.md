# Art prompts

All raw renders in `raw/` came from AICreate's `generate_image` tool (FLUX), on 2026-10-27. FLUX doesn't give the same image twice from the same prompt, so these prompts are a style guide for matching new assets, not a way to rebuild the old ones.

## Shared style

Every prompt ends with the same style block:

> Isometric 3D render, miniature collectible diorama prop, soft clay-like materials, pastel cozy palette, soft studio lighting from the top left, gentle ambient occlusion, cute indie game asset. Single object, centered and fully visible.

**Sprites** (things placed into a scene) add:

> Background is a perfectly flat solid pure magenta color (#FF00FF), no floor, no cast shadow, no text.

Use green (`#00FF00`) instead for anything plum, purple or magenta, and set `screen: 'green'` in `scripts/process-art.mjs`.

**Dioramas** (full scenes) add:

> Elevated 45-degree isometric view, whole diorama centered and fully visible. Plain light grey studio background, no text, no people.

## Room props

Everything placed inside the van (decor, Mochi, plant stages) uses the room's camera and light instead of the studio style above:

> Isometric 3D render viewed from high above at a 35-degree downward angle, three-quarter view from the front-right, the same camera as an isometric dollhouse room. Warm golden interior lighting, soft warm shadows, slightly hazy soft focus, gentle ambient occlusion, soft clay-like materials.

## Character (24 figurines: body × hairstyle × outfit)

The character block stays word-for-word identical in every prompt. Only the body word (`girl` / `boy`), the hair sentence and the outfit sentence change. The original six bob renders said "androgynous chibi traveler" in place of "chibi girl traveler".

| Hairstyle | Hair sentence |
| --- | --- |
| girl · bob | short soft dark indigo bob with blunt bangs |
| girl · ponytail | long dark indigo hair tied in a high ponytail with soft side bangs |
| guy · crop | short messy dark indigo hair with a soft fringe |
| guy · wolf | dark indigo wolf cut, choppy layered hair falling to the nape with a soft fringe *(for Tidecaller: "choppy shaggy layered dark indigo hair…", because "wolf" kept producing cat ears)* |

Hair is always **dark indigo** in the renders: the app recolors it at runtime from the hair mask.

> Full-body collectible vinyl figurine of a cute chibi {girl|boy} traveler character, 3D render. Proportions: very large round head about the same height as the body, small body, short legs. Face: soft round face, large shiny violet-brown eyes, small gentle smile, light rosy cheeks, fair skin. Hair: **{hair sentence}**. Outfit: **{outfit sentence}**. Pose: standing straight, facing the viewer at a slight three-quarter angle, arms relaxed at the sides.

| File | Outfit sentence |
| --- | --- |
| outfit-trailhead | oversized sage-green hoodie with drawstrings and a front pocket, rolled navy shorts, white crew socks and chunky cream sneakers |
| outfit-courier | cropped black bomber jacket with neon lavender trim and cuffs over a mint t-shirt, a mustard messenger bag strap across the chest, loose grey cargo pants with side pockets, dark high-top sneakers with lavender laces |
| outfit-tidecaller | knee-length cream sailor-style coat with a big navy square sailor collar with white stripes, a coral ribbon bow at the chest, small gold buttons, navy leggings and brown ankle boots |
| outfit-keeper | olive-green forest ranger tunic with a short capelet made of overlapping leaf shapes over the shoulders, a brown leather belt with a small pouch, dark green leggings and tall brown boots |
| outfit-starlit | long midnight-navy cloak with tiny gold star embroidery draped over the shoulders with the hood down (so the hood isn't mistaken for hair), high collar with a gold star clasp, pale lavender tunic underneath with a gold belt, dark tights and soft purple boots |
| outfit-nocturne *(green screen)* | elegant deep plum velvet tailcoat with long tails, a darker plum waistcoat with small gold buttons, a cream ruffled cravat with a gold pin, slim dark trousers and shiny black shoes |

## Other subjects

| File | Subject |
| --- | --- |
| van-interior | cozy camper van interior as a miniature diorama cutaway, roof and front wall removed; honey wood floor and cabinetry, raised bed with cream quilt and pastel pillows, compact kitchen, shelves, plants, round window, string lights, woven rug |
| exterior-lake / coast / desert | the same cream-and-lavender rounded retro camper van on a floating square tile of land: alpine meadow by a lake at golden hour / grassy sea cliff at sunset / desert mesa at night with a tiny campfire |
| cat | chubby cream-and-orange tabby curled asleep in a loaf *(room camera)* |
| acc-glasses / acc-clip / acc-headphones / acc-hat | the extra on its own, seen exactly from the front as if worn by an invisible person |
| plant-0 … plant-4 | the same small round terracotta pot: seed → two-leaf sprout → sapling → leafy bush → in bloom |
| decor-fire | tiny cast-iron wood stove on a hexagonal terracotta tile |
| decor-chair | small round peach reading armchair with honey-wood legs and a cream knit throw |
| decor-telescope | brass telescope on a wooden tripod |
| decor-surfboard | short mint surfboard with a cream stripe, standing on its tail |
| decor-lights | three glowing paper lanterns hanging at different heights |
| decor-bunting | short garland of pastel felt triangle flags |
