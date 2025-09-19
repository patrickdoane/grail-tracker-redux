# Mobile-first Wireframes

The following wireframes capture the proposed layouts for the Grail Tracker experience. They are derived from competitive analysis of existing Holy Grail trackers and tailored to the architecture described in `AGENTS.md`.

## Visual & Interaction Principles
- **Mobile-first responsive layouts**: start with single-column flows and progressively enhance to multi-column grids on larger screens.
- **Progress-forward storytelling**: completion rings, rarity status chips, and recent find timelines keep motivation high.
- **Lightweight interactions**: sticky headers, filter sheets, and swipe gestures preserve clarity on small screens.
- **Diablo-inspired yet accessible**: charcoal bases with ember/teal accents and parchment neutrals maintain theme without sacrificing contrast.

## 1. Dashboard / Home

**Mobile layout**

```
┌──────────────────────────────────────────┐
│ Top App Bar: Logo | Search | Profile     │
├──────────────────────────────────────────┤
│ Progress Hero Card                        │
│ ┌───────────────┬──────────────────────┐ │
│ │ 78% Complete  │  Last drop: Tal Rasha │ │
│ │ Ring meter    │  +[Add Find]          │ │
│ └───────────────┴──────────────────────┘ │
├──────────────────────────────────────────┤
│ Sticky Quick Filters (Category ▾ | Ladder│
│ ▾ | Mode ▾)                               │
├──────────────────────────────────────────┤
│ Card: Completion by Category              │
│ [Legendary 54%] [Set 36%] [Unique 62%]    │
├──────────────────────────────────────────┤
│ Card: Recent Finds                        │
│ • Yesterday – Death’s Web (Necro Wand)    │
│ • 3d ago – Arachnid Mesh (Belt)           │
├──────────────────────────────────────────┤
│ Card: High-priority Targets               │
│ • Tyrael’s Might — Rare drop, Act 5       │
│ • Griffon’s Eye — Target LK superchests   │
└──────────────────────────────────────────┘
Bottom Tab Bar: Dashboard | Items | Sets | Runes | Stats
```

**Tablet/Desktop adaptation**

```
┌────────────────────────────────────────────────────────────┐
│ Left Nav (stacked icons) | Top Bar with search + profile    │
├────────────────────────────────────────────────────────────┤
│ ┌───────────────┬────────────────────────────────────────┐ │
│ │ Progress Hero │  Recent Finds (vertical list)          │ │
│ │ (large ring + │                                         │ │
│ │ quick actions)│                                         │ │
│ └───────────────┴────────────────────────────────────────┘ │
│ ┌──────────────────────┬─────────────────────────────────┐ │
│ │ Completion by        │ High-priority Targets grid      │ │
│ │ Category mini-chart  │ (cards with rarity badges)      │ │
│ └──────────────────────┴─────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## 2. Item Browser

**Mobile layout**

```
┌──────────────────────────────────────────┐
│ Top App Bar: Back | Items                │
├──────────────────────────────────────────┤
│ Search Field [🔍 “Griffon's…”]           │
│ Horizontal Filter Chips: Rarity, Slot,   │
│ Runeword, Mode                           │
├──────────────────────────────────────────┤
│ Item Row (swipeable):                    │
│ ┌──────────────────────────────────────┐ │
│ │ Icon │ Griffon’s Eye        [Missing]│ │
│ │      │ Diadem · Unique                 │ │
│ │      │ Sources ▸                       │ │
│ └──────────────────────────────────────┘ │
│ Item Row: tap to expand detail drawer:   │
│ ┌──────────────────────────────────────┐ │
│ │  Drop Sources                         │ │
│ │  • Baal Hell (~0.05%)                 │ │
│ │  • AT level 85 zones                  │ │
│ │  Variants: None                       │ │
│ │  Notes: Farm with 500 MF.             │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
Sticky action: [Add find] floating button
```

**Tablet/Desktop adaptation**

```
┌────────────────────────────────────────────────────────────┐
│ Left Filter Rail (checkboxes, sliders)  |  Item Table/Grid  │
│ - Rarity                                |  ┌──────────────┐ │
│ - Slot                                  |  │ Icon Name ...│ │
│ - Sets/Runewords                        |  └──────────────┘ │
│ - Ownership status                      |  Detail drawer opens
│                                         |  to the right of list
└────────────────────────────────────────────────────────────┘
```

## 3. Item Detail

**Mobile layout**

```
┌──────────────────────────────────────────┐
│ Hero Banner: Item art + rarity ribbon    │
├──────────────────────────────────────────┤
│ Title & Quick Stats                      │
│ Griffon’s Eye (Diadem)                   │
│ • Quality: Unique • Required Lvl: 76     │
│ Buttons: [Mark owned] [Add variant]      │
├──────────────────────────────────────────┤
│ Segmented Tabs (auto-collapse to accord.)│
│ Overview                                 │
│ ┌──────────────────────────────────────┐ │
│ │ +125-150% Lightning Damage             │ │
│ │ +1 to All Skills                       │ │
│ │ +25% Faster Cast Rate                  │ │
│ └──────────────────────────────────────┘ │
│ Drop Sources (accordion)                 │
│ Variants (accordion)                     │
│ Notes (accordion)                        │
├──────────────────────────────────────────┤
│ External Links: [Open D2 Wiki]           │
└──────────────────────────────────────────┘
```

**Tablet/Desktop adaptation**

```
┌────────────────────────────────────────────────────────────┐
│ Hero art left, stats right                                 │
├────────────────────────────────────────────────────────────┤
│ Tabs horizontally across: Overview | Drop Sources | Variants│
│ Content panel with two-column stats, table of sources, etc. │
│ Right sidebar: Player notes + history timeline              │
└────────────────────────────────────────────────────────────┘
```

## 4. Sets & Runewords

**Mobile layout**

```
┌──────────────────────────────────────────┐
│ Top Bar: Sets & Runewords                │
├──────────────────────────────────────────┤
│ Toggle chips: [Sets] [Runewords]         │
├──────────────────────────────────────────┤
│ Collection Card                          │
│ ┌──────────────────────────────────────┐ │
│ │ Tal Rasha’s Wrappings                 │ │
│ │ Progress 4/5 pieces  ▓▓▓▓░ 80%        │ │
│ │ [View checklist]                       │ │
│ └──────────────────────────────────────┘ │
│ Checklist sheet (slides up):             │
│ • Tal Rasha’s Guardianship  [Owned]      │
│ • Tal Rasha’s Adjudication [Missing]     │
│ • ...                                    │
├──────────────────────────────────────────┤
│ Runeword Card                            │
│ ┌──────────────────────────────────────┐ │
│ │ Infinity (4 socket polearm)           │ │
│ │ Runes: Ber + Mal + Ber + Ist          │ │
│ │ Progress: 2/4                          │ │
│ │ [Assign pieces to players ▸]           │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Tablet/Desktop adaptation**

```
┌────────────────────────────────────────────────────────────┐
│ Left column: filter list (class, slot, ladder).             │
│ Right: responsive cards in masonry grid with progress bars. │
│ Selecting a set opens side panel with checklist + trading   │
│ assignments.                                                │
└────────────────────────────────────────────────────────────┘
```

## 5. Statistics / Insights

**Mobile layout**

```
┌──────────────────────────────────────────┐
│ Top Bar: Statistics                      │
├──────────────────────────────────────────┤
│ Completion Snapshot card                 │
│ ┌─────────────┬────────────────────────┐ │
│ │ Ring chart  │  Total items: 431       │ │
│ │ 62%         │  Missing: 164           │ │
│ └─────────────┴────────────────────────┘ │
├──────────────────────────────────────────┤
│ Accordion: Completion by Rarity          │
│ ▸ Legendary (bar chart)                  │
│ ▸ Set                                    │
│ ▸ Unique                                 │
├──────────────────────────────────────────┤
│ Accordion: Drop Source Heatmap           │
│ (mini sparkline + top locations list)    │
├──────────────────────────────────────────┤
│ Share Progress button                    │
└──────────────────────────────────────────┘
```

**Tablet/Desktop adaptation**

```
┌────────────────────────────────────────────────────────────┐
│ Two-column layout:                                          │
│ - Left: stacked cards (overall completion, rarity bars).    │
│ - Right: large chart area (act/boss bar chart, timeline).   │
│ Toolbar: Export CSV | Share card | Toggle timeframe.        │
└────────────────────────────────────────────────────────────┘
```

## 6. Settings & Data Management

**Mobile layout**

```
┌──────────────────────────────────────────┐
│ Top Bar: Settings                        │
├──────────────────────────────────────────┤
│ Section card: Account                    │
│ ┌──────────────────────────────────────┐ │
│ │ Profile photo ▸                       │ │
│ │ Connected email                       │ │
│ │ [Manage auth providers]               │ │
│ └──────────────────────────────────────┘ │
│ Section: Appearance                      │
│ • Theme: Dark ▾                          │
│ • Contrast toggle [ ]                   │
│ Section: Data                            │
│ • Import CSV ▸                           │
│ • Export progress ▸                      │
│ • Cloud sync status: Pending             │
│ Section: Onboarding                      │
│ • [Re-run tutorial]                      │
└──────────────────────────────────────────┘
```

**Tablet/Desktop adaptation**

```
┌────────────────────────────────────────────────────────────┐
│ Left vertical tabs (Account, Appearance, Data, Onboarding). │
│ Right content panel with grouped cards and inline forms.     │
│ Confirmation dialogs appear centered, respecting dark theme. │
└────────────────────────────────────────────────────────────┘
```

