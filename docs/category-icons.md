# Category icons — generation brief

Five department icons for the homepage tiles and the catalog menu — one per department in the
current catalogue. `ppe` and `first-aid` are already rendered; the other three are not.

> **Conflicts with CLAUDE.md §9**, which specifies flat, line-based Lucide icons and forbids
> built-in shading or 3D effects. If this set ships, §9 must be amended in the same change.

## Before you generate

- **The style paragraph below is identical in every prompt, word for word.** Coherence across
  the set is the whole job; a beautiful icon that does not match the rest is a failed icon. The
  three new ones have to sit beside the two that already shipped, so reuse the same seed where
  the tool supports it and judge each candidate next to `ppe.png` and `first-aid.png`.
- **They render at 44×44 CSS pixels.** Anything finer than roughly 1/12 of the canvas vanishes.
  Downscale every candidate to 44px and judge it there before accepting it.
- **Generate on the flat off-white background, then cut out.** Most models give cleaner edges that
  way than when asked for transparency directly.

## The five prompts

Each block is complete — copy it whole, nothing to assemble. The three new prompts already
carry the two trap clauses from the section below; the two older ones predate them and still
need those two lines appended by hand before regenerating.

### 1. `ppe.png` — Himoya vositalari (Personal protective equipment)

```
A folded pleated surgical face mask seen from the front with both ear loops visible, one nitrile glove standing upright behind it and slightly to the right. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

### 2. `first-aid.png` — Birinchi yordam (First aid)

```
A closed rectangular first-aid case with a rounded carry handle on top and a bold white cross centred on its front face. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

### 3. `medical-wear.png` — Tibbiy kiyim (Medical wear — scrubs and lab coats)

```
A neatly folded short-sleeved medical scrub tunic squared to the viewer with its V-neck opening clearly visible on top, resting on one more folded garment of the same kind beneath it so the pair reads as a small stack of clothing. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful. No podium, no base, no stand, no pedestal, no platform the object rests on. No cardboard, no kraft paper, no wood, no warm or tan materials.
```

### 4. `headwear.png` — Bosh kiyimlar (Headwear — surgical caps and clinic caps)

```
A soft surgical scrub cap shaped as a rounded dome with a thick folded turn-up band running around its lower edge, tilted slightly towards the viewer so the hollow underside is hinted at and the shape reads as a cap rather than a bowl. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful. No podium, no base, no stand, no pedestal, no platform the object rests on. No cardboard, no kraft paper, no wood, no warm or tan materials.
```

### 5. `medical-footwear.png` — Tibbiy poyabzal (Medical footwear — clogs and slippers)

```
A single medical clog in three-quarter view with a closed rounded toe, a thick one-piece sole, an open heel with its strap folded forward over the back, and four large round ventilation holes across the top of the toe box. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful. No podium, no base, no stand, no pedestal, no platform the object rests on. No cardboard, no kraft paper, no wood, no warm or tan materials.
```

## Two traps the first batch hit

Add these to every prompt; the originals did not forbid them and two icons came back unusable
until they were fixed by hand:

```
no podium, no base, no stand, no pedestal, no platform the object rests on
no cardboard, no kraft paper, no wood, no warm or tan materials
```

A podium cannot be removed by a brightness threshold — it shares a brightness with the object's
own highlights. A warm material cannot be recoloured without flattening it.

## Negative prompt — same for every prompt

```
photorealism, photograph, glass, chrome, metallic reflections, glossy plastic shine, background gradient, cast shadow, drop shadow, ground reflection, text, letters, numbers, logos, watermark, human hands, faces, blood, needle piercing skin, cluttered composition, multiple unrelated objects, busy background, scene, environment, red, green, yellow, orange, purple, pastel palette, neon, cartoon mascot eyes, thin fragile details, low contrast silhouette, tilted horizon, inconsistent camera angle
```

## Output specification

- Square canvas: generate at **1024×1024**, export at **512×512** PNG with an alpha channel.
- Transparent background after cut-out; no baked background colour, no baked shadow.
- Trim to content, then re-pad to a consistent 10% margin. Scale to equal *visual* weight, not to
  an equal bounding box — a wheelchair and a pill bottle fill a square very differently.
- Keep the 1024px masters for future re-cropping.

## Plugging them in

Filenames match the category slugs the code already keys on. The slug→icon maps live in:

- `apps/web/app/(storefront)/page.tsx`

Add each finished file to `CATEGORY_ART` there. The Lucide fallback in `CATEGORY_ICONS` covers
any slug without a file, so a department with no artwork never renders an empty tile — which is
what `medical-wear`, `headwear`, and `medical-footwear` fall back to today.

## Acceptance check

Put all five side by side at 44px and confirm:

1. Every icon reads as its category without a label.
2. Camera angle, light direction, and material are identical across all five.
3. No icon looks heavier or larger than the others.
4. Nothing outside the four palette colours appears.
5. Each one holds up against both `#FFFFFF` and `#F7F8F9` tile backgrounds.

## Retired prompts

These six departments left the catalogue when it was rebuilt around medical wear. Their PNGs
are still in `public/icons/` and nothing references them. Kept here so the files are explained
and so the set can be rebuilt if those departments return.

<details>
<summary>diagnostics, mobility-aids, medical-devices, medications, consumables, disinfection</summary>

### 3. `diagnostics.png` — Diagnostika (Diagnostics)

```
A stethoscope coiled into one loose loop, its round chest piece in the foreground facing the viewer, the ear tips rising behind it. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

### 4. `mobility-aids.png` — Harakatlanish vositalari (Mobility aids)

```
A manual wheelchair in three-quarter view, one large rear wheel prominent in front, seat and push handles clearly separated from each other. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

### 5. `medical-devices.png` — Tibbiy uskunalar (Medical devices)

```
A compact bedside vital-signs monitor on a short stand, a single simple heartbeat line running across its screen. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

### 6. `medications.png` — Dori vositalari (Medications)

```
A capped pill bottle with a blank unmarked label, two two-tone capsules lying at its base in front of it. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

### 7. `consumables.png` — Sarf materiallari (Consumables)

```
A single luer-lock syringe lying diagonally in front of an open cardboard supply box. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

### 8. `disinfection.png` — Dezinfeksiya (Disinfection and sterilisation)

```
A pump-top antiseptic bottle standing upright with its nozzle angled to the right, a smaller sealed sterilisation pouch leaning against its base in front. 3D rendered icon, single object, isolated on a plain flat #F7F8F9 background. Soft matte clay-plastic material with a subtle satin highlight, no metallic reflections, no glass refraction. Chunky simplified geometry with generously rounded edges and thick forms, readable as a silhouette at 44 pixels. Three-quarter view from a fixed camera 30 degrees above the horizon and 25 degrees to the right, orthographic-leaning perspective with minimal foreshortening. Single soft key light from the upper left plus gentle ambient fill; shading stays on the object itself, no cast shadow on the background. Colour palette restricted to brand blue #0096C7 as the dominant hue, deeper blue #0077A3 for shaded planes and accents, dark navy #1B2430 for outlines and small details, off-white #F7F8F9 and pure white for neutral surfaces, and no other hues. Object centred, occupying about 80 percent of a square canvas with even padding on all four sides. Clean, clinical, trustworthy, professional, not cartoonish and not playful.
```

</details>

