# Visual audit

Screenshots: `npm run shots` (1440×900 and 390×844, full page). "Before" set taken on
2026-11-27 from `dev` at `fd73c98`, after merging #73–#83. Problems ranked worst first.

## Before

### Site-wide
1. **Everything is a bordered, shadowed, rounded card**: filters, forms, facts, empty states,
   stats, sections. With every block boxed, nothing stands out and pages feel like a template.
2. **Radius creep**: 18px cards, 24–32px panels (hero search card, CTA banner, Listing
   "Walk through it in 3D" banner, onboarding tile), pill buttons. Soft and toy-like.
3. **Decorative gradients and glows**: blurred green/gold blobs behind the Home hero, the seller
   CTA and the admin greeting, plus `grain` texture and `glass` blur panels.
4. **A small spaced-uppercase "eyebrow" above every heading** ("FRESH ON AAWAS", "HOW AAWAS
   WORKS", "READY TO EXPLORE", "BROWSE BY PLACE", "FOR OWNERS"…): the trick stops working
   when it's used five times a page.
5. **The footer is heavier than the content**: a full dark-green block that dominates short pages
   (Saved, My bookings, Chat), sometimes taller than the page above it.

### Home
1. **The hero tries to do four things**: a "Nepal's first 3D property marketplace" pill, a
   three-line headline with a gold word, a paragraph, a boxed search with tabs and a district
   select, *and* three "stats" ("5 districts", "100%", "cm") that say nothing measurable.
2. **The search card competes with the headline**: white, shadowed, 24px radius, on a dark
   gradient: it's the brightest thing on the page but not the main message.
3. **Featured grid ends with a lonely orphan** (4 cards in a 3-column grid) and every card
   repeats "3D tour" and a separate round arrow button that does the same as the card.
4. **"How it works" = three identical cards with giant ghost numbers** and icons in squares.
5. **"Step inside in 3D" repeats the hero photo**, and its second card is an empty dark box with a
   play button (no photo for that listing). Then **five identical district cards** with an icon
   in a circle, then a **gradient CTA banner**. Generic "hero + 3 cards + CTA".

### Search
1. **Results are squeezed** into two narrow columns between a boxed filter panel and the map, so
   titles cut off after two words ("Farm house in…", "Cottage near…").
2. **The filter panel is a tall card** that pushes results below the fold on phones (you scroll
   past eight controls before the first home).
3. **The map opens at "all of Nepal"** with overlapping price pins, a "Map view" header and a
   legend chip: it reads as a widget, not a map of these results.
4. **Every card repeats "3D tour"** and a round arrow, and the price sits on a dark gradient
   over the photo, fighting the image.
5. "10 homes found" is a pill in the corner instead of a plain line under the title.

### Listing
1. **Six stacked full-width buttons in the price card** (Open 3D tour, Book, Chat, Save, Share,
   Add to compare) with similar weight: the one thing that matters (3D tour) doesn't win.
2. **Three pills above the title** ("For sale", "3D tour available", "Verified tour"): two
   say the same thing.
3. **Four boxed fact cards** with icons for 3 numbers and a word, then a boxed Area card,
   then a dark gradient "Walk through it in 3D" banner that repeats the tour button.
4. Gallery: the main photo and thumbnails have 28px radii and a floating "Open 3D tour" chip
   *on* the photo, so the photo is cluttered.
5. "What's nearby" empty state sits in another beige box under the map.

### Tour viewer
1. The help card covers the model on phones (top-left, 4 lines of tips).
2. Toolbar labels are 11px on a blurred glass bar; the gold "Book a visit" block shouts more
   than the tools.

### Compare
1. The whole table is wrapped in a card; header row photos are boxed with an "×" floating on them.
2. Every row has the same weight; the rows that differ (price, area) don't stand out.

### Booking
1. Calendar and form are inside a card inside the page; summary is another card with a photo.
2. On phones the summary (price, nights) comes after the button.

### Chat
1. An empty right pane with a tiny icon in a circle; the conversation list is a card in a card.

### Saved / My bookings (empty states)
1. Empty states are boxed cards with an icon in a beige square: generic and small.
2. The dark footer is taller than the page content.

### My listings
1. **Four identical stat cards** (Listings 5, Live now 3, Times saved 0, Bookings to answer 1)
   with icons, before the list. Only "Bookings to answer" needs attention.
2. Each listing row is a card with a nested sand-coloured stats box (card in a card).

### Seller studio
1. The form is a card inside the page with a marketing column of three icon bullets beside it.
2. "My properties" below is two more cards with nested rows; on phones the page scrolls sideways
   (56px): long titles don't truncate.
3. The Floors select is cut to "1 floo" on phones.

### Admin dashboard
1. **Dark gradient greeting banner** ("Good evening, Admin") takes the first screen.
2. **Four identical stat cards with icons in coloured squares** (15 / 7 / 2 / 7).
3. "Insights" chips (Listings with a 3D tour 10, Homes saved 0…) are pills with icons that say
   nothing actionable; what needs action (2 scans waiting) is a small number in a box.
4. Every chart sits in its own card; the scan queue is at the bottom of a long page.

### Login / Signup / OTP
1. The right half is a dark gradient with a glow and a line-art house, plus three icon bullets
   repeating marketing copy. Acceptable idea, heavy execution.
2. Role choice on signup is two cards with icons in squares.

### Not found / Splash / Onboarding
1. 404: giant serif numbers with a gold map pin badge stuck on, then a full dark footer.
2. Onboarding/splash: illustration sits inside a 28px-radius green gradient tile.

## After: batch 1 (Home, Search, Listing)

Each page went through the screenshot → critique → fix loop at 1440 and 390 wide.

### Site-wide (foundation commit)
- Tokens: six-size type scale, 8/12/16px radii, one float shadow, motion tokens.
- **Contrast fixes found while setting tokens:** muted text was 4.1:1 on sand (now `#5f6763`,
  5.0–5.5:1); gold text was 2.5:1 (gold is now marks-only, gold text uses `#7d5f22`, 5.6:1).
- Navbar: solid ivory, gold underline for the active page, one filled button ("Sign up").
- Footer: ivory with a hairline instead of a dark block taller than short pages.
- Cards lose their shadow; glass blur and grain texture retired; page reveal (fade + 8px rise).

### Home (3 rounds)
- Round 1: removed the marketing pill, stats, gradient and glow; photo-first hero with a caption;
  hairline steps with a line-art illustration; district list; owner section without a banner.
  *Critique:* search placeholder cut off; district names crowded their counts.
- Round 2: wider search, counts under the names. *Critique (phone):* the hero photo was repeated
  as the first featured card right below it; illustration lines got thicker when scaled up.
- Round 3: featured list skips the hero home; illustrations keep a constant 1.5px line. Shipped.

### Search (2 rounds)
- Round 1: filters became a compact bar ("More filters" for price, area, verified sellers), results
  in two wide photo-first columns, borderless map; card ↔ pin hover highlight; fade on new search.
  *Critique:* wider container than the rest of the site, so edges didn't line up.
- Round 2: back on the 1200px grid; aligned the Price and Minimum area labels. Shipped.
  Phones: the first home now sits right under the filter bar (it was below eight boxed controls).

### Listing (2 rounds)
- Round 1: chip-free gallery at 12px; full-width title; one primary action (Open 3D tour), one
  secondary (Book), a quiet row for chat/save/share/compare; facts as a hairline row; area card
  unboxed; removed the dark "Walk through it in 3D" banner. On phones the price panel follows the
  title. *Critique:* "Type: For sale" fact repeated the chip; nearby empty state still boxed.
- Round 2: three facts; nearby messages unboxed. Shipped.
