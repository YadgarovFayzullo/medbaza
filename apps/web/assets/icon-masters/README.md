# Icon masters

The 1024px source renders behind `apps/web/public/icons/*.png`. They stay out of `public/` because
nothing should serve them: each sits on a white background with a baked cast shadow and is roughly
three times the size of its export.

| Master | Exported as |
|---|---|
| `emoji-a3b7e3ab-5afb-42fd-9bd3-ba4a95e0ebb2.png` | `ppe.png` |
| `emoji-eb55c892-a037-4123-8abb-f9b2dfa27a88.png` | `first-aid.png` |
| `emoji-75b5b64a-260f-4da9-9a8b-f7686a1813ee.png` | `diagnostics.png` |
| `emoji-56c34434-6073-48dd-8298-1390a9a408c4.png` | `mobility-aids.png` |
| `emoji-8f0e2d11-f48d-45e2-b3b8-b23e730aae7c.png` | `medical-devices.png` |
| `emoji-f698f829-1a71-468f-935f-0d1daa9857cc.png` | `medications.png` |
| `emoji-b8a1083a-d0c4-4c11-bfca-dabd2532ce11.png` | `consumables.png` |
| `emoji-a6bd1ced-6292-4c7b-bb11-dc1f8f736710.png` | `disinfection.png` |

## Processing applied

All eight: knock the white field and its soft shadow out to transparency with a feathered
threshold, trim to content, scale by the longer side so every icon carries the same optical
weight, re-pad to an 8% margin, export 512x512 PNG with alpha.

Two needed more than that:

- **mobility-aids** — the wheelchair was rendered standing on a pale podium the other six do not
  have. A brightness threshold could not take it: the podium and the wheel highlights share a
  brightness. Removed by flooding the background in from the image border, which only travels
  through connected pixels, then keeping the largest connected shape to drop the thin outline arc
  the flood left behind.
- **consumables** — the cardboard box came back warm tan (hue ~30 degrees, about 11k saturated
  pixels), the only warm artwork in a palette that allows no warm hues. Its warm pixels were
  rotated onto the palette's cool neutral with their luminance preserved, so the form survives.

If either is regenerated, add "no podium, no base, no stand" and "no cardboard, no paper, no wood"
to the prompt in `docs/category-icons.md`.
