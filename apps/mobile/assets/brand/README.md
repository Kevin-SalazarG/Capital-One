# Capital One logo source

`capital-one-logo.svg` preserves the exact inline SVG from the header of [Capital One's official US homepage](https://www.capitalone.com/), retrieved on September 12, 2026 (UTC). The source element is `svg.site-header__logo` with the accessible label `Capital One Home`. Capital One owns the logo and trademark.

The original markup is 4,909 bytes. Its SHA-256 is `e3ed634868aeeea34ea6d057cae3a9155f5e7fab2b87ae4859e536405f1a16dd`. It was extracted without optimizing paths, recoloring, removing source attributes, or adding whitespace. Preserve this canonical asset when adapting its rendering for the local prototype.

| Property      | Observed source value                  |
| ------------- | -------------------------------------- |
| View box      | `0 0 418 150`                          |
| Aspect ratio  | `418 / 150` (approximately `2.7867:1`) |
| Wordmark fill | `#013D5B`                              |
| Swoosh fill   | `#CC2427`                              |
| Background    | Transparent                            |

These colors come from the official asset's inline fills; they are not a claim about a complete corporate palette. The SVG contains ten paths, one polygon, and one transparent rectangle. Its styles use explicit fills and identity translations, with no external images, fonts, scripts, gradients, masks, or clipping paths. These vector primitives are supported by the installed `react-native-svg`. The original Angular attributes and CSS classes are source metadata and do not supply the colors or geometry.

## Native splash raster

`capital-one-splash.png` is a transparent 1,254 × 450 PNG rendered directly from the canonical SVG using Sharp 0.35.4 at density 216. The conversion preserves the original view box, aspect ratio, fills, and complete logo; no background, crop, recoloring, or additional artwork is applied. The SHA-256 is `b17daaf66b0164e7353b808b395cf45d2660a7497d99748cbca3646f8e5a2c2b`.

The `expo-splash-screen` plugin in `app.config.ts` supplies the light `#f1f6f8` background and a contained image width of 176 points. Changes to this native configuration require regenerating and rebuilding the app; JavaScript refresh alone does not update the launch screen. The existing local renderer was used for this conversion, so no image-tool dependency was added to the app.
