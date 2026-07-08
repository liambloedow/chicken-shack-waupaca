# The Chicken Shack — Waupaca, WI

Marketing website for a new fried chicken restaurant in King, WI (Waupaca area).
Single-page site, plain HTML/CSS (no build step, no framework). Built collaboratively
with Claude in chat, now handed off for further design/dev work in Claude Code.

## Business facts (real, don't invent alternates)
- Name: The Chicken Shack
- Address: N2723 County Hwy QQ, Waupaca, WI 54981
- Phone: (715) 942-2434
- Email: chicken.shack.waupaca@gmail.com
- Facebook: https://www.facebook.com/profile.php?id=61560247795328
- Menu: deep fried chicken, chicken wings, grilled chicken, fries/sides. No priced
  menu yet — the "Menu" section is intentionally a "full menu coming soon" placeholder.
- Hours: only known info is "open 7 days a week" — real hours haven't been confirmed,
  so the site says "call for today's hours." Update this if you get real hours.
- Currently hiring: line cooks, servers, delivery drivers, FT/PT. Walk-in interviews
  Mon–Fri 11am–4pm. This is real info pulled from their Facebook page — keep accurate
  or ask before changing.

## File structure
```
index.html          — the whole site (nav, hero, food, menu, interior, careers, contact, footer)
assets/logo.png      — the ACTUAL restaurant logo (client-provided), cleaned up and
                       upscaled with a real super-resolution model (EDSR 4x), not just
                       stretched. Source photo was only ~190x180px so there's a real
                       resolution ceiling — don't scale this above ~800px wide without
                       expecting softness.
assets/food-basket.jpg      — photo of wings & fries, used in the "What we do" section
assets/interior.jpg         — dining room photo, used in "Pull up a chair" section
assets/exterior-evening.jpg — building at dusk w/ string lights + neon OPEN sign, used in Contact
assets/exterior-day-unused.jpg  — NOT currently used on the site (available if needed)
assets/exterior-wide-unused.jpg — NOT currently used on the site (available if needed)
```

## Design system already in place
Bold/fun direction, colors pulled from the logo itself:
- `--red: #B8271F` (primary brand color, nav/hero/menu section bg)
- `--red-dark: #7E1610`
- `--gold: #F2A93B` (accent, CTAs)
- `--gold-deep: #DE8A12`
- `--butter: #FFF6E3` (page background)
- `--trim: #F5D97E`
- `--ink: #2B1B12` (near-black, used for borders/text — NOT pure black)
- Display font: Alfa Slab One (chunky, playful — matches the logo's bold lettering)
- Body font: Nunito
- Visual language: thick dark borders + hard drop shadows (like a diner sign), pill
  buttons, a scrolling "diner ticker" marquee, badge/sticker shapes. All CSS vars are
  defined at the top of the `<style>` block — change the palette from one place.

## What's already been decided (don't relitigate without asking)
- Hero background is a CSS-only sunburst gradient (no photo) — the client specifically
  asked to move away from a busy photo background in favor of a clean look built
  around the logo.
- Building/interior photos are used sparingly (2 of them), lower on the page, not in
  the hero — this was a deliberate choice after discussing whether photos helped or
  hurt (client felt a few real photos add local authenticity without cluttering the hero).
- Single scrolling page with anchor-link nav, not separate pages — appropriate for a
  small local restaurant site.

## Known open items / likely next steps
- **Food photo enhancement**: the client wants the food-basket.jpg made more
  "appetizing" via Higgsfield AI image editing. This was attempted but the Higgsfield
  workspace ran out of credits before it completed — if you have Higgsfield MCP access
  and credits, this is still an open task. Otherwise standard photo editing
  (color/contrast/crop) is a reasonable substitute.
- **Real menu with prices**: menu section is a placeholder. Client said they'd build
  this out with Higgsfield later — will likely need a proper menu grid/card layout
  once real items + prices exist.
- **Hours of operation**: currently a "call us" placeholder — swap in real hours if
  the client provides them.
- No backend, no CMS, no analytics, no forms — everything is static and read-only
  (mailto:/tel: links only). If adding a contact form or booking, that's new scope,
  not a fix.

## Things to preserve unless explicitly asked to change
- The real logo in assets/logo.png (not a placeholder/recreation — this is the
  client's actual brand asset)
- The color palette and font pairing (established direction, client approved)
- Business contact info and hiring details (real facts, not filler copy)
