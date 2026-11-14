# Hand-drawn art in JavaScript

**A picture made of thousands of marks, not shapes.** The goal is a canvas piece that someone would believe was drawn
on paper with pastel, crayon and pencil. Everything is code: one canvas, no images, no SVG, no libraries.

The emotion-brief approach is learned from Kevin Ngo's public prompts (x.com/kevin_t_ngo). Learn the method; never copy
his pictures, wording or code.

### The idea
- **Choose 3–5 dry tools and commit.** Name them before writing code and say how each behaves. Every mark in the piece
  comes from one of them. More tools than five reads as a filter pack; one tool reads as a demo.
- **Strokes, not fills.** Every area is many short marks with a direction, a pressure curve (thin – thick – thin), a
  slight wobble and a little colour jitter. No gradient as a visible surface, no outline of constant width.
- **Paper first.** Make the paper before any colour: a base tone, low mottle, fibres and a height map (the *tooth*).
  Dry media catch the peaks and skip the valleys, so specks of paper show through the colour.
- **Layer in passes**, like a person would:
  1. paper and tooth;
  2. block-in: big dark and mid masses with the widest tool, loose and fast;
  3. mid-tones: hatching that follows the form (a roof's slope, a wave's run, a leaf's vein);
  4. lights: paler passes on top, leaving earlier colour showing between strokes;
  5. accents: a few bright or dark marks where the eye should land (a lit window, a rim of light, one star);
  6. a final tooth pass with `multiply`, so the colour sits *in* the paper.
- **Composition before detail.** Block in the big shapes first. Spend detail where the eye lands; keep other areas
  quiet but still marked. Use every pixel, edge to edge.

### How each tool behaves

| Tool | Mark | In code |
| --- | --- | --- |
| Oil pastel | wide, waxy, opaque; smears along the stroke and drags the colour under it | wide ribbon strokes, high alpha, a second offset pass in a mixed colour; tooth breaks only the edges |
| Wax crayon | medium width, gritty, broken by the paper | 3–4 thin misaligned passes per stroke; alpha × tooth, so valleys stay bare |
| Coloured pencil | thin, directional hatching; builds tone slowly | long parallel lines, 0.6–1.2px, alpha .15–.4, many layers at 2–3 angles |
| Chalk | dusty, soft edged, sits on top of everything | short broad strokes, low alpha, speckled; drawn late; heavy tooth skip |
| Charcoal | dark, grainy, smudged with a finger | grainy strokes, then a soft smudge pass (a blurred copy at low alpha) along one direction |
| Conté | square stick: crisp on the edge, broad on the flat | strokes that switch between a 1px edge and a 5–8px flat, earthy colours, firm pressure |

### Palette
Pick a small family and use it with weights; the paper is part of it. The 1990s cel-anime family works well for warm,
nostalgic light:

| Role | Colour | Weight |
| --- | --- | --- |
| Paper / light | cream `#f3e8d2` | ~30% |
| Shadow / night | indigo `#2e3466` | ~25% |
| Sky / water | teal `#3f8f8c` | ~20% |
| Light-struck surfaces | peach `#f2b38b` | ~15% |
| Accent (used sparingly) | coral `#e8735a` | ~10% |

Shift the family per piece (dawn, dusk, interior, night) but keep it small. Mix colours *optically*: two strokes side
by side or one over another, never a blended gradient. Shadows are a cooler colour, not black.

### Engineering rules in Pane
- **One file**: `src/components/illustrations/<slug>.tsx` with a named export taking `StudioPieceProps`, a demo
  `src/demos/<slug>.demo.tsx`, and a Studio spec `src/studio/pieces/<slug>.studio.ts`. Copy the structure of
  `gouache-lake.tsx` and its spec.
- **A pure draw.** Export `draw(ctx, w, h, t, values)`. Same seed and values → same picture, at any size. Use `rng` from
  `src/studio/schema.ts` (one stream per layer, so adding stars does not move the waves); never `Math.random` or `Date.now`.
- **Place marks in normalised coordinates** (0–1 of width and height), so 16:9, 1:1 and 9:16 are composed, not stretched.
- **Bake heavy layers once.** Paper, block-in and hatching go into offscreen canvases cached by (seed, values, size), and
  are composited with `drawImage(layer, 0, 0, w, h)`. Never redraw thousands of strokes per frame.
- **Never reset the canvas transform** in `draw` (no `setTransform(1,0,0,1,0,0)`, no `resetTransform`). The Studio
  scales the context for 2× and 3× export; a reset paints only the top-left quarter. Draw in logical `w × h` units.
- **A tiny, slow live layer.** If anything moves, it is small and slow: under 3–4 px/s (a lamp's shimmer, a glint on
  water, a drifting tail). `time` set → render exactly that frame. Reduced motion → a still frame. Stop off screen and
  in hidden tabs.
- **First paint under about 3 s** at 1920×1080 on a laptop. If the bake is longer, bake in chunks across frames and show
  the block-in while detail arrives.
- **Studio spec**: seed, a palette or time-of-day choice with 3 presets that each look finished, stroke density, paper
  tooth, one or two piece-specific controls. Sizes 16:9 (default), 1:1, 4:5, 9:16 and the link card; `png: "canvas"`.

### Does it look digital? Check, then fix

Render the piece at 1920×1080, look at it full size, then zoom into three areas. Fix one thing at a time.

| It looks… | Fix |
| --- | --- |
| like a vector or an SVG | replace the fill with strokes; wobble every straight edge; let lines overshoot and not close |
| smooth or airbrushed | remove the gradient; build the tone from 2–4 hatching passes at different angles |
| like paper was pasted on top | raise tooth on the strokes themselves (alpha × tooth), not only the final overlay |
| uniform | vary stroke length, angle and pressure per area; denser where the eye lands, looser at the edges |
| muddy | fewer colours; let the paper and earlier layers show between strokes instead of covering them |
| empty somewhere | quiet areas still carry marks: a light hatch, a few chalk dashes, the paper's own tone |
| over-grainy | lower the tooth strength, not the stroke count |
| boiling when it animates | the art re-randomises per frame; move all randomness into the baked layers |

Ask each round: would someone believe a person drew this with these tools?

### The emotion brief
A subject brief ("a harbour at dawn") gets a competent picture. A feeling brief gets a picture with a point of view.

- **Write a story, not a scene**: a vivid personal memory of 100–200 words. Where you were, what you heard and smelled,
  what you hoped or feared, how it ended.
- **Nothing from the story may appear in the picture**, and no people. The model has to find a different scene whose
  light, weather, distance and colour carry the same feeling. That translation is what makes the picture feel meant.
- **Fix the tools, the format and the era**, and leave the subject open. Constraints on the marks, freedom on the scene.
- **Ask it to look.** The model must render and read its own output before it calls the piece done.

#### Prompt template

```
Draw one picture by hand – in code.

Before you start, study [reference folder or style, e.g. ./refs/, or "a 1980s picture-book look"]:
learn how the marks are made, not what the pictures show.

Tools: [3–5 dry tools, e.g. oil pastel, coloured pencil, white chalk – or "choose your own"].
Name them before you write any code, say how each one behaves on paper, and use only those.

Format: [e.g. one 16:9 piece, 1920×1080, in JavaScript only – one canvas, no images, no libraries].

Colour: [era or colour reference, e.g. the warm dusk colours of 1990s cel anime]. Treat it as a
family to choose from, not a picture to copy. Make something new.

The feeling: read the story below. Do not illustrate it. Nothing from it may appear in the picture –
no place, object, animal or event it mentions – and no people at all. Choose a different scene whose
light, weather, distance and colour give a viewer the same feeling.

Story:
[a vivid personal memory, 100–200 words]

Constraints:
- It must look drawn by a person with those tools: visible directional strokes, pressure, layered
  colour, paper showing through. Not digital, no flat fills, nothing that looks like an SVG.
- Use every pixel. No empty margins; quiet areas still carry marks.
- Seeded randomness only: the same seed draws the same picture.
- Work in passes: paper, block-in, mid-tones, lights, accents, a final tooth pass.
- Render it and look at the result at full size and zoomed into three areas. Fix what looks digital
  and repeat. Do not say it is done until you have looked.
- Take your time: spend the effort on the marks, not on features.
```

#### Two filled-in briefs

**The last night in the old flat**
```
Tools: wax crayon, charcoal, soft pastel, a white conté pencil.
Format: one 16:9 piece, 1920×1080, JavaScript only.
Colour: early-1990s anime night interiors – indigo, teal, one warm peach.
Story: The night before I moved abroad, the flat was all boxes. The kettle was packed, so my brother and
I drank warm cola out of the glasses we had decided to leave behind. Every sound
echoed because the rugs were gone. We sat on the floor with our backs against the radiator and played
the radio quietly, the station my dad used to leave on. Neither of us said anything about tomorrow.
At two in the morning the streetlight outside clicked off for the first time I could remember, and
the room went blue. I remember feeling that the place was already letting go of us before we had let
go of it, and that this was kind, somehow.
```

**The first proper wave**
```
Tools: oil pastel, coloured pencil, chalk.
Format: one 16:9 piece, 1920×1080, JavaScript only.
Colour: 1990s cel-anime summer – coral, peach, teal, cream.
Story: I learned to surf at thirty-one, badly, for a whole summer. Every morning I paddled out, got
knocked off, swallowed salt and walked back up the beach with my board dragging behind me. On the last
week of the holiday the water was glassy and an older woman next to me just said "now". I stood up
and the board kept going. It was maybe six seconds. I could hear nothing at all, then my own laugh. I
fell off near the shore in water up to my knees and sat there grinning while the next wave rolled
over my lap. I was late for breakfast and did not care.
```

### Worked examples in Pane
Three pieces were drawn with this method. Each names its tools and the feeling it was briefed with; none shows it.

- [`pastel-harbor`](https://paneui.vercel.app/#/pastel-harbor) – oil pastel, wax crayon, coloured pencil and white chalk
  on cream. Feeling: the morning after a long-awaited yes.
- [`pencil-greenhouse`](https://paneui.vercel.app/#/pencil-greenhouse) – coloured pencil hatching, conté, soft pastel and
  chalk on off-white. Feeling: being six and lost in a new game.
- [`chalk-observatory`](https://paneui.vercel.app/#/chalk-observatory) – chalk, pastel pencil, charcoal and a white pencil
  on dark indigo. Feeling: watching the first replies arrive after posting your work.

Open any of them in the Studio (`https://paneui.vercel.app/#/studio/<slug>`) to change the seed, palette and tooth, and
read `draw` in its file to see the passes.
