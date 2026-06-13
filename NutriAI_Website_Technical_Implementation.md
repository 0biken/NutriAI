# NutriAI — Website Technical Implementation

**Scope:** Marketing landing page (nutriai.ng or similar)
**Stack:** Vanilla HTML/CSS/JS — no framework. GSAP for all animation. No build step required for MVP.

---

## 1. Tech Stack

| Layer | Tool | Rationale |
|---|---|---|
| Markup | HTML5 | Semantic, SEO-friendly, no framework overhead |
| Styling | CSS custom properties + utility classes | Brand tokens live in `:root`; no Tailwind needed at this scale |
| Animation | GSAP 3 + ScrollTrigger plugin | Industry standard for the scroll-pinned/scrub pattern; alma.food uses the same |
| Fonts | Google Fonts (Inter 400/500/600) | Already in existing page; matches brand spec |
| Form | Formspree or Loops.so | Zero-backend waitlist capture; webhook to Notion/Airtable |
| Hosting | Vercel (static) | Free tier, instant CDN, custom domain, auto HTTPS |
| Analytics | Plausible (privacy-first) | GDPR-safe; lightweight; no cookie banner needed |

**CDN imports (GSAP — no npm/build required):**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

---

## 2. File Structure

```
nutriai/
├── index.html          ← Single page, all 12 sections
├── style.css           ← All tokens + section styles (split from HTML for caching)
├── main.js             ← All GSAP logic (split for clarity)
├── assets/
│   ├── logo.svg
│   └── og-image.png    ← 1200×630 for social sharing
└── favicon.ico
```

---

## 3. Section-by-Section Build Spec

### 01 — Nav
- Sticky, `position: fixed`, starts transparent
- On scroll past 40px: GSAP `.to(nav, { background: 'rgba(13,31,15,0.95)', backdropFilter: 'blur(12px)' })`
- Triggered via `ScrollTrigger.create({ start: 40, toggleClass: { targets: nav, className: 'scrolled' } })`

### 02 — Hero
**GSAP entrance timeline (fires on DOMContentLoaded):**
```
tl
  .from('.hero-eyebrow',   { y: 24, autoAlpha: 0, duration: 0.7 })
  .from('.hero-headline',  { y: 32, autoAlpha: 0, duration: 0.9 }, '-=0.5')
  .from('.hero-sub',       { y: 20, autoAlpha: 0, duration: 0.7 }, '-=0.5')
  .from('.hero-actions',   { y: 16, autoAlpha: 0, duration: 0.6 }, '-=0.4')
  .from('.phone-frame',    { y: 48, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, '-=0.8')
  .from('.ticker-wrap',    { autoAlpha: 0, duration: 0.5 }, '-=0.3')
```
- Easing on all: `cubic-bezier(.22,1,.36,1)` → GSAP equivalent: `'power3.out'`
- Food ticker: pure CSS `@keyframes` infinite marquee (no GSAP needed)

### 03 — Problem Bar (Stats strip)
- Count-up fires once on viewport entry
```js
ScrollTrigger.create({
  trigger: '#stats',
  start: 'top 75%',
  once: true,
  onEnter: () => countUpAll()   // custom fn using gsap.to({val:0}, {...})
});
```
- Three stat blocks stagger-reveal: `stagger: 0.12`

### 04–06 — Scroll-Pinned Features (the GSAP centrepiece)

This is the alma.food pattern. The implementation uses **CSS sticky + GSAP screen switching**, not `ScrollTrigger.pin()`, for cleaner mobile degradation.

**HTML structure:**
```html
<section id="features">
  <div class="features-grid">

    <!-- LEFT: three stacked content panels, each 100vh -->
    <div class="features-panels">
      <div class="feature-panel" data-panel="0"> <!-- Snap & Scan --> </div>
      <div class="feature-panel" data-panel="1"> <!-- Cycle Sync  --> </div>
      <div class="feature-panel" data-panel="2"> <!-- Budget      --> </div>
    </div>

    <!-- RIGHT: phone stays fixed via CSS sticky -->
    <div class="features-phone-col">
      <div class="phone-sticky">        <!-- position: sticky; top: 0; height: 100vh -->
        <div class="feat-phone">
          <div class="feat-screen">
            <div class="phone-scene" data-scene="0"> <!-- scan UI   --> </div>
            <div class="phone-scene" data-scene="1"> <!-- cycle UI  --> </div>
            <div class="phone-scene" data-scene="2"> <!-- budget UI --> </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>
```

**CSS:**
```css
#features { background: var(--forest); }
.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.feature-panel {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 80px 8% 80px 10%;
}
.phone-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* All scenes stacked, only one visible at a time */
.feat-screen { position: relative; }
.phone-scene {
  position: absolute; inset: 0;
  opacity: 0;
  pointer-events: none;
}
```

**GSAP scene switching:**
```js
const panels = gsap.utils.toArray('.feature-panel');
const scenes = gsap.utils.toArray('.phone-scene');

function activateScene(i) {
  scenes.forEach((scene, idx) => {
    gsap.to(scene, {
      opacity: idx === i ? 1 : 0,
      y:       idx === i ? 0 : (idx < i ? -14 : 14),
      duration: 0.65,
      ease: 'power3.inOut'
    });
  });
}

activateScene(0); // show first on load

panels.forEach((panel, i) => {
  ScrollTrigger.create({
    trigger: panel,
    start:   'top 45%',
    end:     'bottom 55%',
    onEnter:     () => activateScene(i),
    onEnterBack: () => activateScene(i),
  });
});
```

**Panel text reveals** (each panel's copy animates in as it enters):
```js
panels.forEach(panel => {
  const els = panel.querySelectorAll('.ft-tag, .ft-headline, .ft-body, .ft-point');
  gsap.from(els, {
    y: 24, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: panel, start: 'top 65%', once: true }
  });
});
```

**Mobile (<768px):** The grid collapses to single column. `.features-phone-col` gets `display: none`. Each panel shows its own inline phone mockup (separate element, shown only on mobile via CSS).

### 07 — Who It's For (Personas)
- Horizontal scroll of persona cards: native `overflow-x: auto` with `scroll-snap-type: x mandatory`
- Cards fade+slide in on entry: `ScrollTrigger.batch('.persona-card', { onEnter: batch => gsap.from(batch, { y: 24, autoAlpha: 0, stagger: 0.1 }) })`

### 08 — Food Database
- Food tag cloud: built in JS, each `<span>` appended dynamically
- GSAP entrance: `gsap.from(tags, { autoAlpha: 0, scale: 0.85, stagger: { each: 0.04, from: 'random' }, ease: 'back.out(1.4)' })`
- Random lighting: `setInterval` cycles 5 random `.lit` classes every 1.8s
- Count-up on the `2000+` number: same `ScrollTrigger` count-up pattern as stats bar

### 09 — Clinical Credibility
- Partner badges: stagger fade-in
- Pull-quote: `gsap.from` with slight y-offset, fires on entry

### 10 — Pricing
- Two cards stagger in. Premium card gets a subtle pulse on the OPay badge: `gsap.to('.opay-badge', { scale: 1.04, repeat: -1, yoyo: true, duration: 1.8, ease: 'sine.inOut' })`

### 11 — Final CTA
- Full-viewport dark section
- Headline: split into two lines, each animates from below with stagger
- Email input field: on focus, border glows via CSS transition (no GSAP needed)
- Submit: Formspree POST. On success: GSAP `.to(form, { autoAlpha: 0 })` → reveal confirmation message

### 12 — Footer
- Static, no animation

---

## 4. Global Reveal Pattern

All standard section elements (eyebrows, headings, body text, cards) use one batch trigger:
```js
ScrollTrigger.batch('.reveal', {
  onEnter: batch => gsap.from(batch, {
    y: 28, autoAlpha: 0, duration: 0.75,
    stagger: 0.1, ease: 'power3.out'
  }),
  start: 'top 88%',
  once: true
});
```
Add `class="reveal"` to any element that should use this default behaviour. Delays controlled by adding `data-delay="0.2"` and reading it in the batch callback.

---

## 5. Animation Token Reference

| Property | Value |
|---|---|
| Primary easing | `power3.out` (≈ `cubic-bezier(.22,1,.36,1)`) |
| Standard duration | `0.7s – 0.9s` |
| Scene switch duration | `0.65s`, `power3.inOut` |
| Hero entrance stagger | `0.08s` between elements |
| Card batch stagger | `0.1s` |
| Count-up duration | `2s`, `power2.out` |
| Reduced motion | Wrap all GSAP in `if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)` |

---

## 6. Waitlist Integration

1. Point form `action` to **Formspree** endpoint (free tier, 50 submissions/month — enough for launch)
2. On success webhook → **Loops.so** (email marketing): auto-enroll to a "NutriAI waitlist" audience
3. Alternatively: **Tally.so** embedded form handles both capture + notification in one

---

## 7. SEO & Performance

- `<title>`: *NutriAI — Nigeria's First AI Nutrition App | Built for Nigerian Bodies*
- Meta description: 155 chars, leading with the problem stat
- OG image: 1200×630, dark hero with logo + tagline
- `loading="lazy"` on all below-fold images/mockups
- GSAP CDN has `crossorigin` attribute for preload hint
- Target Lighthouse score: 90+ Performance, 100 Accessibility
- Semantic HTML throughout: `<nav>`, `<main>`, `<section>`, `<footer>` with proper ARIA labels

---

## 8. Launch Checklist

- [ ] Custom domain connected in Vercel
- [ ] Formspree endpoint active and tested
- [ ] OG image renders correctly on Twitter/WhatsApp/LinkedIn (use opengraph.xyz to check)
- [ ] `prefers-reduced-motion` guard around all GSAP code
- [ ] Keyboard navigation verified (Tab focus visible on all CTAs)
- [ ] Mobile tested on real device (iPhone SE + Samsung A-series as baselines)
- [ ] Analytics snippet live before soft launch
