---
name: frontend-design
description: Design system and UI conventions for apps/web (Next.js + Tailwind v4 + shadcn). Use whenever building or editing pages, components, or animations in apps/web so new UI matches the existing look instead of generic default Tailwind/AI aesthetic.
---

# Frontend design system — apps/web

This project already has a design system in place. Don't invent a new one per component — reuse these tokens and patterns.

## Color tokens

Never hardcode hex/rgb colors in new components. Use the CSS variables already defined in [globals.css](apps/web/app/globals.css) via their Tailwind utility classes:

- `bg-background` / `text-foreground` — page base
- `bg-card` / `text-card-foreground` — panels, cards
- `bg-primary` / `text-primary-foreground` — primary actions (accent is a violet `oklch(0.38 0.19 273)`)
- `bg-secondary`, `bg-muted`, `bg-accent` + matching `-foreground` — secondary surfaces
- `border-border`, `ring-ring`, `bg-destructive` — borders, focus rings, danger states
- `bg-sidebar*` — sidebar-specific tokens (separate from card/background)

Both light and dark values are already defined on `:root` and `.dark`. Never add a new color unless it's a genuinely new semantic token — and if you do, add it as an oklch CSS variable in both blocks, not an inline value.

## Typography

No custom type scale file exists — use Tailwind's default scale consistently instead of arbitrary values:

- Page titles: `text-2xl font-semibold` (rarely `text-3xl` for a hero/landing-style page)
- Section headings: `text-lg font-semibold`
- Body: `text-sm` (this app runs dense/compact — most body copy is `text-sm`, not `text-base`)
- Secondary/meta text: `text-xs text-muted-foreground`
- Font family is `system-ui` stack (see `body` in globals.css), not Geist despite the `--font-geist-sans` variable being wired — don't introduce a third font.

Never use one-off sizes like `text-[13px]` or `text-[22px]`. Pick the nearest step in the scale.

## Spacing

Use Tailwind's default 4px-based scale (`gap-2`, `p-4`, `space-y-6`, etc.), snapping to multiples of 2 (0.5rem) for anything that isn't inline icon/text spacing. Common rhythm in this app:

- Card padding: `p-4` or `p-6`
- Section stacking: `space-y-6` or `space-y-8`
- Inline control gaps: `gap-2` (icon+label), `gap-4` (form fields)

Avoid mixing arbitrary pixel margins with the scale in the same component.

## Component patterns

Base primitives live in [components/ui](apps/web/components/ui) (shadcn "new-york" style, see [components.json](apps/web/components.json)) — extend these instead of writing raw `<button>`/`<input>`/`<div className="rounded border">` from scratch:

- `Button` ([button.tsx](apps/web/components/ui/button.tsx)) — variants `default | destructive | outline | secondary | ghost | link`, sizes `default | sm | lg | icon | icon-sm | icon-lg`. Add a new variant to `buttonVariants` (cva) rather than overriding classes ad hoc.
- `Card`, `Input`, `Label` — same pattern: cva/`cn()`-based, `data-slot` attributes for styling hooks.
- New primitives should follow the same shape: `cva` for variants, `cn()` (from `@/lib/utils`) for merging classes, forward all native props, expose a `data-slot`.

Pull new primitives instead of hand-rolling when one fits:

- MagicUI is wired as a registry alias in [components.json](apps/web/components.json): `npx shadcn add @magicui/<component>`.
- For 21st.dev, there's no verified global registry alias — browse the component on 21st.dev and copy the exact `npx shadcn add <url>` command it provides on the component page, then run that directly.

Either way, adapt the pasted component to the tokens/patterns above (replace hardcoded colors with the CSS variables, replace placeholder copy, match spacing) — don't leave it in its original styling.

## Animation

Both `motion` and `framer-motion` are dependencies here — they're the same library (`motion` is the current name, `framer-motion` the legacy one) with an identical `motion/react`-style API. Prefer `import { motion } from "framer-motion"` for new code to match most copy-pasted 21st.dev/MagicUI snippets as-is; `motion/react` also works if you're editing code that already uses it. Don't mix both import styles within the same file.

- Scroll reveals: `whileInView` + `viewport={{ once: true }}`, small `y` offset (8–16px) fading in — keep it subtle, not bouncy.
- Staggered lists: parent `variants` with `staggerChildren` (~0.05–0.1s), not per-child manual delays.
- Hover/press feedback on interactive elements: `whileHover`/`whileTap` with small scale (1.02–1.05) or opacity change — most buttons/cards in this app don't animate today, so add this deliberately on new interactive surfaces rather than everywhere.
- Respect `prefers-reduced-motion` — don't rely on animation alone to convey state.

## Avoid the generic-AI-site look

- No purple-to-pink gradient hero blobs, no generic glassmorphism, no oversized rounded-full badge pills unless the rest of the app already uses them.
- Match the existing radius scale (`--radius: 0.625rem` → `rounded-md`/`rounded-lg` via the `radius-*` theme vars), don't introduce fully-rounded (`rounded-full`) cards/panels.
- Reuse existing icons from `lucide-react` (already a dependency) rather than emoji or a new icon set.
- This app is a dense internal tool (dashboards, work items, forms), not a marketing landing page — default to compact, information-dense layouts unless the task is explicitly a public/marketing page.
