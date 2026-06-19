# Tinlip Autocare — Design System

## Identity

**Product**: Tinlip Autocare — Kenya's roadside assistance and vehicle care platform.
**Register**: Product UI. Design serves the product, not the other way around.
**Audience**: Kenyan drivers, 25–55 years old. Mobile-first, M-Pesa-native. Trust and response speed are the currency.
**Tone**: Direct, warm, confident. Short sentences. No jargon. "Get Help Now" not "Submit Service Request".

---

## Color

### Design intent

Amber signals urgency, safety, and action — the color of hazard lights. Dark navy grounds it with authority and legibility. The system is **committed**: amber carries 30–50% of the surface on action-critical and hero screens.

### Palette

| Token | HSL value | Role |
|-------|-----------|------|
| `--primary` | `38 78% 52%` | Amber brand. Buttons, rings, active states, hero headers |
| `--background` (light) | `210 20% 98%` | Near-white with a cool tint — not cream, not warm |
| `--foreground` | `222 47% 11%` | Deep navy ink |
| `--nav-dark` | `222 47% 11%` | Hero sections, welcome screen, dark card headers |
| `--card` | `0 0% 100%` | Pure white surfaces |
| `--muted` | `215 16% 90%` | Dividers, progress bars, inactive state fills |
| `--muted-foreground` | `215 16% 47%` | Supporting text, placeholders |
| `--success` | `142 72% 38%` | Coverage active, checkmarks, completed status |
| `--warning` | `32 95% 44%` | Pending states, active jobs, caution |
| `--destructive` | `0 72% 51%` | Errors, destructive actions |

### Usage rules

- Amber on dark navy (`--nav-dark`) is the hero combo. Use it for welcome screen, onboarding headers, celebration overlays.
- Never use amber text on white below 16px — contrast fails.
- `--success` green: completed/covered states only. Not general positive messaging.
- `--warning` amber (slightly darker than primary): pending/in-progress badge fills only.
- Gray supporting text (`--muted-foreground`) must pass 4.5:1 on `--background`. The value `215 16% 47%` on `210 20% 98%` is borderline — never go lighter than this.

---

## Typography

| Role | Family | Weight | Size range |
|------|--------|--------|------------|
| Display / Hero | Plus Jakarta Sans | 700–800 | 24–40px |
| Heading | Plus Jakarta Sans | 600–700 | 18–24px |
| Body | DM Sans | 400–500 | 13–15px |
| Mono / Code | System mono | 700 | inherit |

### Rules

- Hero max: 2.5rem on content screens. Only welcome/celebration screens go larger.
- Body line-length: 65ch max on desktop layouts.
- Vehicle registration plates: always `font-mono font-bold` — they are IDs, not labels.
- Claim/reference codes: `font-mono text-primary font-bold` — the most important output a service request produces.
- `text-wrap: balance` on all h1–h3.
- No tracking-widest on registration inputs — plates are already distinctive in mono.

---

## Spacing & Layout

- Base unit: 4px (Tailwind default).
- Mobile canvas: 375px wide, `px-4` (16px each side). This is the primary target.
- Desktop breakpoint: `md` (768px). Sidebar nav replaces bottom nav. Content max-width 640px, centered.
- Bottom nav: 80px reserved — `pb-20 md:pb-4`. Always account for `env(safe-area-inset-bottom)`.
- Cards: `rounded-xl` (12px), `card-shadow`, `border`. Never nested.
- Section rhythm: `mb-4` between minor sections, `mb-5` between major sections.
- Step indicators: thin pill bars (`h-1.5 rounded-full`), amber fill for completed steps.

---

## Components

### Buttons

- Primary hero: `variant="amber"` — `h-14 w-full text-base font-bold`. Gets `.btn-pulse` animation (ring shadow pulse) when it is the single most urgent action on screen.
- Secondary: `variant="outline"` or ghost/link.
- Destructive: `variant="destructive"`.
- Disabled: `opacity-60`. Never hide; always show that an action exists but is gated.

### Cards

- Base: `bg-card border rounded-xl p-4 card-shadow`.
- Interactive: add `hover:shadow-md transition-shadow cursor-pointer`.
- Selected: `border-2 border-primary` — replaces `border-border`, no background tint needed.
- Status tinted: `bg-success/10 border border-success/20`, `bg-warning/10 border border-warning/20`.

### Status badges

| Status | Color |
|--------|-------|
| `open` | muted |
| `in_progress` | warning |
| `service_assigned` | warning/amber |
| `service_completed` | success |
| `closed` | muted (line-through label) |

### Forms

- Input height: `h-11` to `h-12`.
- Label: `text-sm font-medium text-foreground`. Required marker: `*` suffix in the label.
- Error container: `bg-red-50 text-red-600 rounded-lg p-3 text-sm` — never raw error strings from Supabase.
- OTP inputs: `font-heading font-bold` — standout style reinforces the security context.
- Real-time validation: green `CheckCircle2` icon inside the input once a field passes. Border shifts to `border-success/50`.

### Bottom drawers (Vaul)

- Overlay: `bg-black/40 backdrop-blur-sm`.
- Content: `bg-background rounded-t-2xl max-h-[90dvh]` — matches app background, not pure white.
- Drag handle: `w-8 h-1 bg-muted rounded-full mx-auto mt-3 mb-1`.
- Internal layout: header (title + subtitle) → scrollable content area → sticky CTA at bottom.
- Use drawers for contextual pickers and confirmations. Full-screen navigation for multi-step flows with 3+ steps.

### Navigation

- Bottom nav (mobile): `bg-nav-dark` (deep navy), amber dot or fill for active tab.
- Desktop sidebar: white background, amber active indicator, `nav-dark` text.

---

## Motion

| Name | Definition | Used for |
|------|------------|---------|
| `animate-fade-in` | opacity 0→1, translateY 8→0, 0.3s ease-out | Screen entry, step transitions |
| `animate-scale-in` | opacity 0→1, scale 0.9→1, 0.2s ease-out | Success icons, modal content |
| `animate-slide-up` | translateY 100%→0, 0.3s ease-out | Bottom sheet entry |
| `.btn-pulse` | ring shadow pulse, 2s ease-in-out infinite | Primary hero CTA only |
| `chip-pop` | scale + translateY, cubic-bezier(0.34, 1.56, 0.64, 1) | Celebration chip reveals |
| `confetti-fall` | translateY + rotate, 1.5s forwards | Post-onboarding celebration |
| `animate-pulse-amber` | opacity 1→0.7, 2s infinite | Cursor blink in typewriter |

### Rules

- All keyframes defined in `index.css`.
- Step transitions: wrap step content in `key={step}` to trigger `animate-fade-in` on change.
- Every animation needs `@media (prefers-reduced-motion: reduce)` — use `opacity` crossfade instead.
- No bounce, no elastic. Ease-out only. expo or quint curves for premium feel.

---

## Voice & Copy

- Action labels: verb-first. "Get Help Now", "Add Vehicle", "Pay via M-Pesa", "View Service".
- Reference codes: "Reference #" in all UI (not "Claim Code", not "Incident ID").
- Service requests: "Service" or "Job" in all user-facing copy (not "Incident").
- OTP screen: "Verify Your Identity" — security framing, not tech framing.
- Empty states: tell the user what to do, not what's missing. "Add your first vehicle to get covered" not "No vehicles found".
- Errors: never expose raw Supabase or edge function error strings. Always a human-readable fallback with a clear next action.
- Pending approval: "under review" not "pending" — "review" implies human attention, "pending" implies a queue.

---

## Absolute don'ts

- No gradient text (`background-clip: text` with a gradient).
- No side-stripe borders (colored `border-left/right > 1px` as card accents).
- No nested cards.
- No eyebrow labels on every section (small uppercase tracked text above every heading).
- No "Incident" in user-facing copy — always "Service" or "Job".
- No full-screen navigation for selections that fit in a bottom drawer.
- No raw plate numbers in lowercase — `font-mono font-bold`, uppercase always.
- No modals for simple confirmation — use inline states or Vaul drawers.

---

## File locations

| File | Purpose |
|------|---------|
| `src/index.css` | CSS custom properties, keyframes, utility classes |
| `tailwind.config.ts` | Color tokens, font families, animation utilities |
| `src/components/ui/` | shadcn-managed — never edit directly |
| `src/components/` | Project components — edit freely |
| `src/lib/supabase.ts` | All DB + auth helpers — no raw supabase calls in screens |
