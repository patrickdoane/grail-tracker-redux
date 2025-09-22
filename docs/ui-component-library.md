# Shared UI Component Library

The shared component library lives in `grail-client/src/components/ui` and provides the building blocks for the dashboard experience. Import from the directory root to pull in component styles automatically:

```tsx
import { Button, Card, Container, Stack } from '../components/ui'
```

## Primitives

- **Button** – Solid, secondary, surface, and ghost variants across `sm`, `md`, and `lg` sizes with optional leading/trailing icons and built-in loading affordance.
- **Card** – Structural container with `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, and `CardDescription` subcomponents to compose elevated sections.
- **Layout** – `Container` constrains page width and padding, `Stack` handles flex-based spacing, `Grid` provides responsive auto-fit layouts driven by `minItemWidth`.

## Interactive Elements

- **FilterChip** – Toggleable chips that expose selection state via `aria-pressed`; ideal for compact filter controls.
- **FloatingActionButton** – Primary or surface-styled FAB with icon + optional label for prominent actions.

## Status & Feedback

- **StatusBadge** – Pill-style indicator with `neutral`, `success`, `warning`, `danger`, and `info` variants plus a `subtle` tone.
- **ProgressRing** – SVG-based radial progress with accessible `role="progressbar"`, optional label, and customizable formatter for the center value.

## Usage Notes

- Components rely on the design tokens defined in `src/index.css`; adjustments to color, spacing, or typography cascade automatically.
- Stick to the exported helpers before introducing one-off layouts—`Stack`/`Grid` cover most spacing scenarios, and `Card` keeps elevation consistent.
- When composing actions, prefer `Button` for primary interactions and `FilterChip` for toggle/filter patterns instead of ad-hoc elements.
- Keep accessibility in mind: supply descriptive `aria-label` values for icon-only `FloatingActionButton`s and meaningful labels for `ProgressRing`.

## Roadmap

- Extend the library with additional primitives (tabs, table scaffolds) as new feature work demands.
- Introduce Storybook (or a lightweight catalog) to visualize variants once the component set stabilizes.
