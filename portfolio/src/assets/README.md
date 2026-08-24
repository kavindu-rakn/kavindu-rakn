# Assets

## `wordmark-r.svg` — required

The blackletter **R**, used in three places from this one file so they cannot
drift apart:

1. The `R` in "Kavindu Ranathunga" on the landing page
2. The mark in the site header
3. `public/favicon.svg`, generated from this path

### Export requirements

| Requirement | Why |
|---|---|
| **Real vector paths** — not an embedded `<image>` | A raster inside an SVG is still a raster; it will blur at headline size |
| **Convert text to outlines** before export | Otherwise the glyph renders only on machines that have the font |
| **Single `<path>` if possible**, solid fill | Simplest to recolour |
| **No hard-coded `width` / `height`** | The headline scales with `clamp()`; the SVG must scale with it |
| **`viewBox` tight to the ink** | Predictable box to align against the surrounding type |

Do **not** bake in a colour. The fill is overridden with `currentColor` so the
mark inverts on the dark cyanotype ground — a hard-coded black R is invisible
there.

### Vertical alignment

Blackletter R descends below the baseline. Because the viewBox is tight to ink,
the baseline position inside it is not recoverable from the file, so the optical
offset is tuned by eye via a CSS custom property on the wordmark component
rather than guessed here.
