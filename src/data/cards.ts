// Learning content. Subject: "Field Notes" — the natural world you meet on the road.
// To add a topic, add it to TOPICS and write cards with that topic id.

export type TopicId = 'sky' | 'night' | 'earth' | 'ocean' | 'forest' | 'animals'

export interface Topic {
  id: TopicId
  name: string
  short: string
  accent: string
  /** Which landscape composition illustrates this topic. */
  scene: 'meadow' | 'night' | 'peaks' | 'coast' | 'forest' | 'pasture'
}

export const TOPICS: Record<TopicId, Topic> = {
  sky: { id: 'sky', name: 'Sky & Weather', short: 'Sky', accent: '#8ec5ff', scene: 'meadow' },
  night: { id: 'night', name: 'Night Sky', short: 'Night', accent: '#a99cff', scene: 'night' },
  earth: { id: 'earth', name: 'Rocks & Mountains', short: 'Earth', accent: '#f0b48a', scene: 'peaks' },
  ocean: { id: 'ocean', name: 'Coast & Ocean', short: 'Ocean', accent: '#6fd3d0', scene: 'coast' },
  forest: { id: 'forest', name: 'Forest & Plants', short: 'Forest', accent: '#8fd19e', scene: 'forest' },
  animals: { id: 'animals', name: 'Animal Minds', short: 'Animals', accent: '#ffb3c1', scene: 'pasture' },
}

export const TOPIC_ORDER: TopicId[] = ['sky', 'night', 'earth', 'ocean', 'forest', 'animals']

type Question =
  | { kind: 'mcq'; prompt: string; correct: string; wrong: string[]; explain: string }
  | { kind: 'tf'; prompt: string; answer: boolean; explain: string }

export interface CardData {
  id: string
  topic: TopicId
  title: string
  hook: string
  body: string
  q: Question
}

export interface Card extends CardData {
  choices: string[]
  answerIndex: number
  prompt: string
  explain: string
}

const RAW: CardData[] = [
  // ── Sky & Weather ────────────────────────────────────────────
  {
    id: 'sky-blue', topic: 'sky', title: 'Why the sky is blue',
    hook: 'Sunlight is every color at once.',
    body: 'As sunlight passes through the air, tiny gas molecules scatter short blue wavelengths far more than long red ones. That scattered blue reaches your eyes from every direction — so the whole sky glows blue.',
    q: { kind: 'mcq', prompt: 'So why do sunsets turn orange and red?',
      correct: 'Light crosses more air, so most blue scatters away first',
      wrong: ['The sun cools down in the evening', 'Dust reflects the color of the ground', 'The ozone layer turns red at dusk'],
      explain: 'Near the horizon, sunlight travels through far more atmosphere. Most of the blue is scattered out along the way, leaving the warm reds and oranges.' },
  },
  {
    id: 'sky-clouds', topic: 'sky', title: 'How clouds are born',
    hook: 'Every cloud is a crowd of tiny droplets.',
    body: "Air rising up a mountain or off warm ground expands and cools. Cooler air can't hold as much water vapor, so the vapor condenses onto specks of dust, salt, or pollen — billions of droplets we see as a cloud.",
    q: { kind: 'mcq', prompt: 'What does water vapor need to condense into cloud droplets?',
      correct: 'Cooling air and tiny particles to cling to',
      wrong: ['Strong wind and bright sunlight', 'Lightning to split the water', 'A sudden rise in air pressure'],
      explain: 'Cooling brings air to its dew point, and particles called condensation nuclei give the vapor a surface to collect on.' },
  },
  {
    id: 'sky-rainbow', topic: 'sky', title: 'Chasing rainbows',
    hook: 'Every rainbow is centered on your own shadow.',
    body: 'Raindrops act like tiny prisms: sunlight enters, bends, reflects off the back of the drop, and splits into colors. The bow forms a circle about 42° around the point directly opposite the sun — the shadow of your head.',
    q: { kind: 'mcq', prompt: 'Where should the sun be if you want to spot a rainbow?',
      correct: 'Behind you, low in the sky',
      wrong: ['Directly overhead', 'In front of you, above the rain', "It doesn't matter"],
      explain: 'The rainbow sits opposite the sun, so face the rain with the sun at your back. A low morning or evening sun lifts more of the arc above the horizon.' },
  },
  {
    id: 'sky-thunder', topic: 'sky', title: 'Counting the thunder',
    hook: 'Light wins every race against sound.',
    body: "Lightning's flash reaches you almost instantly, but thunder travels only about 343 meters per second. Count the seconds between flash and rumble: roughly every 3 seconds is 1 kilometer (about 5 seconds per mile).",
    q: { kind: 'mcq', prompt: 'You count 6 seconds between a flash and its thunder. About how far away was the strike?',
      correct: 'About 2 kilometers',
      wrong: ['About 200 meters', 'About 6 kilometers', 'About 20 kilometers'],
      explain: "6 seconds ÷ 3 seconds per km ≈ 2 km. If you can hear thunder at all, you're close enough to be struck — get indoors or into a hard-topped vehicle." },
  },
  {
    id: 'sky-fog', topic: 'sky', title: 'Morning fog',
    hook: 'Ever walked through a cloud? Fog counts.',
    body: 'On clear, calm nights the ground radiates heat into space and chills the air just above it. When that air reaches its dew point, droplets form right at ground level — radiation fog, which usually burns off as the morning sun warms things up.',
    q: { kind: 'tf', prompt: 'True or false: fog is essentially a cloud that forms at ground level.', answer: true,
      explain: "Fog and clouds are made the same way — tiny water droplets condensing in cooled air. Fog just forms where we're standing." },
  },
  {
    id: 'sky-altitude', topic: 'sky', title: 'Cooler up high',
    hook: 'Mountains make their own weather.',
    body: 'Air pressure drops as you climb, and expanding air cools. On average the air gets about 6.5 °C cooler for every 1,000 meters of elevation — which is why peaks can wear snow while valleys bloom.',
    q: { kind: 'mcq', prompt: 'You drive from a valley up a 2,000 m mountain pass. About how much cooler is it likely to be?',
      correct: 'About 13 °C cooler',
      wrong: ['About 1 °C cooler', 'About 30 °C cooler', "Warmer — you're closer to the sun"],
      explain: "2 × 6.5 °C ≈ 13 °C. Being slightly closer to the sun makes no real difference — thinner, expanding air is what matters." },
  },

  // ── Night Sky ────────────────────────────────────────────────
  {
    id: 'night-polaris', topic: 'night', title: 'The steady North Star',
    hook: 'One star barely moves all night.',
    body: "Earth spins on an axis that points almost exactly at Polaris. As the planet turns, other stars wheel in circles across the sky while Polaris stays nearly fixed in the north. It isn't the brightest star — just the best placed.",
    q: { kind: 'mcq', prompt: 'Why does Polaris seem to stay still while other stars move?',
      correct: "It sits almost directly above Earth's north rotation axis",
      wrong: ["It's the closest star to Earth", 'It orbits Earth as fast as we spin', "It's the brightest, so our eyes lock onto it"],
      explain: 'Points near the rotation axis barely move as Earth spins — like the center of a turning wheel. Bonus: its height above the horizon roughly equals your latitude.' },
  },
  {
    id: 'night-phases', topic: 'night', title: 'Phases of the Moon',
    hook: 'The Moon is always half lit.',
    body: 'The Sun always lights half of the Moon. As the Moon orbits Earth over about 29.5 days, we see different amounts of that sunlit half — from a thin crescent to a full disc and back again.',
    q: { kind: 'mcq', prompt: "What causes the Moon's phases?",
      correct: "Our changing view of the Moon's sunlit half",
      wrong: ["Earth's shadow covering part of the Moon", 'Clouds drifting across the Moon', 'The Moon spinning to show its dark side'],
      explain: "Phases come from viewing angle. Earth's shadow only falls on the Moon during a lunar eclipse — a rarer, different event." },
  },
  {
    id: 'night-meteors', topic: 'night', title: 'Shooting stars',
    hook: 'That streak of light is a speck of space dust.',
    body: "Meteors aren't stars at all. They're bits of comet or asteroid debris hitting our atmosphere at tens of kilometers per second, heating the air until it glows — usually burning up 80–100 km above the ground.",
    q: { kind: 'mcq', prompt: 'Most meteors you see are caused by objects about the size of…',
      correct: 'A grain of sand',
      wrong: ['A car', 'A house', 'A small moon'],
      explain: 'Most are tiny — sand-grain to pebble-sized. Their enormous speed, not their size, makes them blaze so brightly.' },
  },
  {
    id: 'night-lightyear', topic: 'night', title: 'Light from the past',
    hook: 'Stargazing is a form of time travel.',
    body: "Light is fast, but space is huge. A light-year is how far light travels in a year — about 9.5 trillion kilometers. When you see a star 500 light-years away, you're seeing light that left it 500 years ago.",
    q: { kind: 'mcq', prompt: 'What does a light-year measure?',
      correct: 'Distance',
      wrong: ['Time', 'Brightness', 'Speed'],
      explain: 'Despite the name, a light-year is a distance: how far light travels in one year.' },
  },
  {
    id: 'night-milkyway', topic: 'night', title: 'The Milky Way',
    hook: 'That hazy band is our galaxy, seen from inside.',
    body: 'Our galaxy is a flat spiral disc of a few hundred billion stars, and we live inside it. Looking along the disc, countless distant stars blur together into the soft river of light you can see from dark skies.',
    q: { kind: 'mcq', prompt: 'Why does the Milky Way look like a band across the sky?',
      correct: 'We see our disc-shaped galaxy edge-on, from within',
      wrong: ['It is a ring of stars orbiting Earth', 'It is a long cloud of gas in our atmosphere', 'It is moonlight scattered by dust'],
      explain: 'From inside a flat disc, stars bunch up along its plane — which wraps all the way around the sky as a band.' },
  },
  {
    id: 'night-eyes', topic: 'night', title: 'Night eyes',
    hook: "Your eyes have a night mode. It's just slow.",
    body: 'In the dark your pupils widen within seconds, but the deeper change — rod cells rebuilding a light-sensitive pigment — takes 20 to 30 minutes. One glance at a bright white screen can undo much of it.',
    q: { kind: 'mcq', prompt: 'Which flashlight color best protects your night vision?',
      correct: 'Red', wrong: ['Bright white', 'Blue', 'Green'],
      explain: 'Rod cells are barely sensitive to deep red light, so a red lamp lets you read a map without undoing your dark adaptation.' },
  },

  // ── Rocks & Mountains ────────────────────────────────────────
  {
    id: 'earth-rocks', topic: 'earth', title: 'Three kinds of rock',
    hook: 'Every rock has an origin story.',
    body: 'Igneous rocks form when molten rock cools — like granite or basalt. Sedimentary rocks form from layers of sand, mud, or shells pressed together. Metamorphic rocks are existing rocks transformed by heat and pressure, like marble.',
    q: { kind: 'mcq', prompt: 'A rock that formed from cooled lava is…',
      correct: 'Igneous', wrong: ['Sedimentary', 'Metamorphic', 'Fossilized'],
      explain: "Igneous comes from the Latin for 'fire'. Lava that cools quickly at the surface makes fine-grained basalt or even glassy obsidian." },
  },
  {
    id: 'earth-fossils', topic: 'earth', title: 'Where fossils hide',
    hook: 'Ancient life is stored in layers.',
    body: 'Fossils form when remains are buried quickly in sediment that slowly hardens into rock. That is why nearly all fossils turn up in sedimentary rock — melting, or the squeezing that makes metamorphic rock, tends to destroy them.',
    q: { kind: 'mcq', prompt: 'Which rock type is most likely to contain fossils?',
      correct: 'Sedimentary', wrong: ['Igneous', 'Metamorphic', 'All of them equally'],
      explain: 'Gentle burial in layered sediment preserves shapes. Melting or intense pressure erases them.' },
  },
  {
    id: 'earth-mountains', topic: 'earth', title: 'How mountains rise',
    hook: 'The Himalayas are still growing.',
    body: "Earth's outer shell is broken into tectonic plates that drift a few centimeters a year. When two plates collide, crust crumples and stacks upward. India pushing into Asia built the Himalayas — and it's still pushing.",
    q: { kind: 'mcq', prompt: "What built most of the world's great mountain ranges?",
      correct: 'Colliding tectonic plates',
      wrong: ['Meteor impacts', 'Wind piling up sand', 'Glaciers bulldozing soil into heaps'],
      explain: 'Plate collisions fold and lift the crust over millions of years. Erosion then sculpts the peaks we see.' },
  },
  {
    id: 'earth-valleys', topic: 'earth', title: 'Reading valleys',
    hook: "A valley's shape tells you who carved it.",
    body: 'Rivers cut downward, leaving narrow V-shaped valleys. Glaciers are slow rivers of ice that grind the sides and floor too, leaving broad U-shaped valleys with steep walls — think Yosemite.',
    q: { kind: 'mcq', prompt: 'You drive through a wide valley with a flat floor and steep, straight cliffs. It was most likely carved by…',
      correct: 'A glacier', wrong: ['A small stream', 'Wind', 'An earthquake'],
      explain: "That U shape is a glacier's signature. Rivers alone usually leave a tighter V." },
  },
  {
    id: 'earth-hotsprings', topic: 'earth', title: 'Natural hot springs',
    hook: 'Some of the best baths are heated by the planet.',
    body: 'Rain soaks deep into the ground through cracks, where rock gets hotter the deeper you go — especially near volcanic areas. The heated water rises back to the surface, often carrying dissolved minerals.',
    q: { kind: 'tf', prompt: 'True or false: hot springs get their heat from the sun warming shallow pools.', answer: false,
      explain: "The heat comes from below — Earth's interior warms groundwater deep underground before it rises back up." },
  },
  {
    id: 'earth-sand', topic: 'earth', title: 'Black sand beaches',
    hook: 'Sand is just rock, broken down very small.',
    body: "Many beaches are pale because they're mostly quartz, a tough mineral that survives long journeys down rivers. Black sand beaches, like those in Hawaii or Iceland, usually form when waves grind down dark volcanic rock such as basalt.",
    q: { kind: 'mcq', prompt: 'Where does black beach sand usually come from?',
      correct: 'Volcanic rock worn down by waves',
      wrong: ['Burned driftwood', 'Oil pollution', 'Dark seaweed'],
      explain: 'Lava that meets the sea gets shattered and ground by waves into dark basalt sand.' },
  },

  // ── Coast & Ocean ────────────────────────────────────────────
  {
    id: 'ocean-tides', topic: 'ocean', title: 'The tides',
    hook: 'The Moon tugs the whole ocean.',
    body: "The Moon's gravity pulls hardest on the side of Earth facing it and least on the far side, stretching the oceans into two bulges. As Earth turns through both, most coasts get two high tides about every 24 hours and 50 minutes.",
    q: { kind: 'mcq', prompt: 'What is the main cause of ocean tides?',
      correct: "The Moon's gravity",
      wrong: ['Wind blowing across the sea', 'Earthquakes on the sea floor', 'Rivers flowing into the ocean'],
      explain: "The Moon does most of the work; the Sun adds a smaller pull. When they line up, we get extra-big 'spring' tides." },
  },
  {
    id: 'ocean-waves', topic: 'ocean', title: 'What a wave really is',
    hook: "Waves travel. The water mostly doesn't.",
    body: 'A wave is energy moving through water. As it passes, surface water moves in small circles and ends up roughly where it started. Only in shallow water does a wave slow, steepen, and break onto the shore.',
    q: { kind: 'tf', prompt: 'True or false: in the open ocean, water travels across the sea along with each wave.', answer: false,
      explain: "The energy travels; the water mostly bobs in place. That's why a floating gull rises and falls instead of riding away." },
  },
  {
    id: 'ocean-salt', topic: 'ocean', title: 'Why the sea is salty',
    hook: 'The ocean is seasoned by the mountains.',
    body: 'Rain is slightly acidic, so it slowly dissolves minerals from rock. Rivers carry those dissolved salts to the sea. When seawater evaporates, the water leaves but the salt stays — concentrating over millions of years.',
    q: { kind: 'mcq', prompt: "Where does most of the ocean's salt originally come from?",
      correct: 'Minerals washed out of rocks on land',
      wrong: ['Fish', 'Salt mined by people', 'Melting icebergs'],
      explain: 'Rivers deliver dissolved minerals and evaporation removes only water. Undersea vents add some, too.' },
  },
  {
    id: 'ocean-oxygen', topic: 'ocean', title: 'Breathing thanks to the sea',
    hook: 'Take a breath — part of it came from the ocean.',
    body: "Phytoplankton are microscopic, plant-like drifters near the ocean's surface. Through photosynthesis they produce a huge share of Earth's oxygen — roughly half, by many estimates.",
    q: { kind: 'mcq', prompt: "Roughly how much of Earth's oxygen production comes from ocean life like phytoplankton?",
      correct: 'About half', wrong: ['Almost none', 'Exactly 10%', 'All of it'],
      explain: "Scientists estimate around 50%. Tiny ocean drifters matter as much for our air as all the world's forests." },
  },
  {
    id: 'ocean-rip', topic: 'ocean', title: 'Rip currents',
    hook: 'The calm-looking gap between waves can be the strongest current.',
    body: "A rip current is a narrow channel of water rushing away from shore. It often looks like a darker, calmer gap in the breaking waves. Rips don't pull you under — they pull you out.",
    q: { kind: 'mcq', prompt: "If you're caught in a rip current, what should you do?",
      correct: 'Swim parallel to the shore, then angle back in',
      wrong: ['Swim straight to shore as hard as you can', 'Dive down to the bottom', 'Swim farther out to sea'],
      explain: "Rips are narrow, so swimming along the beach gets you out of the channel. If you're tired, float and signal for help." },
  },
  {
    id: 'ocean-blue', topic: 'ocean', title: 'Why the sea looks blue',
    hook: 'Water itself has a color.',
    body: 'Water absorbs red, orange, and yellow light more than blue. In deep, clear water, most of the light that makes it back to your eyes is blue. Green or brown water usually means plankton, algae, or sediment.',
    q: { kind: 'mcq', prompt: 'Why does deep, clear ocean water look blue?',
      correct: 'Water absorbs warm colors and sends back blue',
      wrong: ['It only mirrors the sky', 'Sea salt is blue', 'Algae dye it blue'],
      explain: "Reflected sky adds a little, but water's own absorption of red light is the main reason — it's why underwater photos look blue." },
  },

  // ── Forest & Plants ──────────────────────────────────────────
  {
    id: 'forest-air', topic: 'forest', title: 'Trees are built from air',
    hook: "A tree's mass mostly comes from thin air.",
    body: 'During photosynthesis, leaves take in carbon dioxide and use sunlight to combine it with water, making sugars. Those sugars become wood. Soil provides some minerals, but only a tiny fraction of a tree\'s weight.',
    q: { kind: 'mcq', prompt: "Where does most of a tree's mass come from?",
      correct: 'Carbon dioxide from the air',
      wrong: ['The soil', 'Rainwater alone', 'Sunlight turning into matter'],
      explain: "Carbon pulled from CO₂ makes up much of a tree's dry weight. Sunlight provides the energy, not the material." },
  },
  {
    id: 'forest-autumn', topic: 'forest', title: 'Autumn colors',
    hook: 'Fall colors were hiding all summer.',
    body: 'Leaves are green because of chlorophyll. In autumn, trees stop making it and it breaks down, revealing yellow and orange pigments that were there all along. Reds are different: some trees make new red pigments in fall.',
    q: { kind: 'mcq', prompt: 'Why do many leaves turn yellow in autumn?',
      correct: 'Chlorophyll fades, revealing yellow pigments already there',
      wrong: ['Frost paints them', 'They absorb color from sunsets', 'Insects change their color'],
      explain: 'Carotenoids — the pigments that color carrots — are present all year, just masked by green chlorophyll.' },
  },
  {
    id: 'forest-rings', topic: 'forest', title: 'Tree rings',
    hook: 'Trees keep a diary in their wood.',
    body: 'In many climates a tree grows a light, fast layer in spring and a dark, dense layer later in the year. Each pair makes one ring. Wide rings mean good growing years; narrow rings can mean drought or cold.',
    q: { kind: 'mcq', prompt: 'In a temperate forest, one tree ring usually represents…',
      correct: 'One year', wrong: ['One month', 'One decade', 'One big storm'],
      explain: 'Count rings to estimate age. Scientists use their widths to reconstruct climate going back thousands of years.' },
  },
  {
    id: 'forest-fungi', topic: 'forest', title: 'The underground network',
    hook: 'Forests trade beneath your feet.',
    body: 'Most plants partner with mycorrhizal fungi, whose threads wrap around or into roots and spread far through the soil. The fungi help roots gather water and nutrients like phosphorus; in return, the plant feeds the fungi sugars.',
    q: { kind: 'mcq', prompt: 'What do plants typically give mycorrhizal fungi in exchange for nutrients?',
      correct: 'Sugars made by photosynthesis',
      wrong: ['Oxygen', 'Seeds', 'Nothing — the fungi are parasites'],
      explain: "It's a trade: sugars for water and minerals. These partnerships are over 400 million years old." },
  },
  {
    id: 'forest-moss', topic: 'forest', title: 'The moss compass myth',
    hook: "Don't trust the moss to get you home.",
    body: "In the Northern Hemisphere moss can favor the shadier, damper north side of trees. But local shade, slope, and moisture matter far more, so moss often grows all the way around a trunk. It's a poor compass.",
    q: { kind: 'tf', prompt: 'True or false: moss reliably grows on the north side of trees, so you can navigate by it.', answer: false,
      explain: 'Moss follows moisture and shade, not direction. Use the sun, the stars, or a real compass instead.' },
  },
  {
    id: 'forest-redwood', topic: 'forest', title: 'Giants that drink fog',
    hook: "The world's tallest trees sip from clouds.",
    body: 'Coast redwoods can grow taller than 110 meters. During dry summers, coastal fog condenses on their needles and drips to the ground, and the trees can even absorb some moisture directly through their leaves.',
    q: { kind: 'mcq', prompt: 'Besides rain, what important water source do coast redwoods use?',
      correct: 'Ocean fog', wrong: ['Glacier meltwater', 'Underground hot springs', 'Water stored in their bark from winter'],
      explain: 'Fog can supply a large share of the water in redwood forests during dry months.' },
  },

  // ── Animal Minds ─────────────────────────────────────────────
  {
    id: 'animals-blink', topic: 'animals', title: 'The slow blink',
    hook: "Cats have a way of saying 'I trust you.'",
    body: "When a relaxed cat narrows its eyes and closes them slowly, it's a friendly signal. Researchers found cats are more likely to slow-blink back at people who slow-blink at them — and to approach them.",
    q: { kind: 'mcq', prompt: "What is a cat's slow blink usually a sign of?",
      correct: 'Relaxation and trust', wrong: ['Aggression', 'Hunger', 'An eye irritation'],
      explain: "A slow blink is a bit like a cat's smile. Try it back — soften your eyes and blink slowly." },
  },
  {
    id: 'animals-purr', topic: 'animals', title: 'Purring',
    hook: "A purr isn't always a happy sound.",
    body: 'Cats purr when content, but also when stressed, giving birth, or hurt. Purring may help cats calm themselves, and scientists are still studying how its low frequencies affect the body.',
    q: { kind: 'tf', prompt: "True or false: cats only purr when they're happy.", answer: false,
      explain: 'Purring can be self-soothing, so read the whole cat — ears, posture, and tail — not just the sound.' },
  },
  {
    id: 'animals-whiskers', topic: 'animals', title: 'Whisker wisdom',
    hook: "Whiskers are a cat's measuring tape.",
    body: "A cat's whiskers are deep, sensitive hairs that detect tiny air movements and touch. The ones on the muzzle span roughly the width of the cat's body, helping it judge whether it can fit through a gap.",
    q: { kind: 'mcq', prompt: "What's one key job of a cat's whiskers?",
      correct: 'Sensing surroundings and judging gaps',
      wrong: ['Keeping the face warm', 'Attracting other cats', 'Tasting the air'],
      explain: 'Whiskers feel air currents and nearby objects — handy in the dark. Never trim them.' },
  },
  {
    id: 'animals-eyeshine', topic: 'animals', title: 'Eyeshine',
    hook: 'A mirror behind the eye.',
    body: 'Cats have a reflective layer behind the retina called the tapetum lucidum. Light that passes through the retina bounces back for a second chance to be detected — great in dim light, and why their eyes glow in your headlights.',
    q: { kind: 'mcq', prompt: "Why do a cat's eyes glow when light shines on them at night?",
      correct: 'A reflective layer behind the retina bounces light back',
      wrong: ['They produce their own light', 'Their eyes are extra wet', 'They contain glowing proteins'],
      explain: 'The tapetum lucidum boosts night vision. Deer, dogs, and many other animals have one too.' },
  },
  {
    id: 'animals-crows', topic: 'animals', title: 'Crows remember faces',
    hook: 'Never annoy a crow.',
    body: 'In a famous study, researchers wearing one particular mask caught and released some wild crows. For years afterward, crows scolded anyone wearing that mask — even birds that had never been caught, apparently learning from others.',
    q: { kind: 'mcq', prompt: 'What did the masked-researcher experiment show about crows?',
      correct: 'They recognize and remember individual human faces',
      wrong: ["They can't tell people apart", 'They fear all masks equally', 'They forget threats within a day'],
      explain: "Crows recognized the 'dangerous' face and spread the warning socially across the flock." },
  },
  {
    id: 'animals-bees', topic: 'animals', title: 'The waggle dance',
    hook: 'Honeybees give directions by dancing.',
    body: "A forager returning with good news performs a figure-eight 'waggle dance' in the hive. The angle of the waggle run points relative to the sun, and its length signals the distance to the flowers.",
    q: { kind: 'mcq', prompt: "What does a honeybee's waggle dance communicate?",
      correct: 'The direction and distance to food',
      wrong: ['That the hive is in danger', 'Which bee is the queen', 'The temperature outside'],
      explain: 'Direction is encoded relative to the sun, distance by how long the bee waggles. Other bees follow the directions to the flowers.' },
  },
]

// Deterministic shuffle so the correct answer isn't always in the same spot,
// but stays put across refreshes.
function seeded(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

function build(c: CardData): Card {
  if (c.q.kind === 'tf') {
    return { ...c, choices: ['True', 'False'], answerIndex: c.q.answer ? 0 : 1, prompt: c.q.prompt, explain: c.q.explain }
  }
  const rand = seeded(c.id)
  const choices = [c.q.correct, ...c.q.wrong]
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { ...c, choices, answerIndex: choices.indexOf(c.q.correct), prompt: c.q.prompt, explain: c.q.explain }
}

/** All cards, interleaved by topic so the feed has variety. */
export const CARDS: Card[] = (() => {
  const byTopic = TOPIC_ORDER.map((t) => RAW.filter((c) => c.topic === t))
  const out: Card[] = []
  const max = Math.max(...byTopic.map((l) => l.length))
  for (let i = 0; i < max; i++) for (const list of byTopic) if (list[i]) out.push(build(list[i]))
  return out
})()

export const CARD_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.id, c]))
