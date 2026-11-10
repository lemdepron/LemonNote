# View Tab Implementation Design

## Intent
Fill the View ribbon tab with Word/OneNote-like view controls: view modes, navigation pane, zoom, ruler, gridlines, and scroll modes. Keep existing Write/Split/Read modes accessible.

## Goals
- Add 5 view modes: Read Mode, Draft, Print Layout, Outline, Immersive Reader
- Add Navigation Pane (headings + Find)
- Add Zoom (50-300% slider + preset buttons)
- Add Ruler (horizontal, shows page width/margins)
- Add Gridlines (overlay grid)
- Add Vertical/Side-to-Side scroll toggle
- Persist per-note where sensible, global otherwise

## Non-Goals
- Multi-window features (New Window, Arrange All, Side by Side, Synchronous Scrolling, Reset Window Position, Switch Windows)
- Floating objects (P21)
- Real pagination (CSS print handles it)

## Current State
- NotePage has `mode` state: "write", "split", "read"
- Header has Write/Split/Read buttons
- ViewTab has: Reading width, Editor font/size, Spell check, Statistics
- Note.style stores typography per note
- Preferences (localStorage) stores global settings

## Approach
Add `viewMode` state to NotePage (separate from `mode`). View modes control how the READ side renders. The Write/Split/Read buttons stay for editing mode.

### Data Storage
Per-note (in note.style):
- `viewMode`: "read" | "draft" | "print" | "outline" | "immersive"
- `showNavPane`: boolean
- `zoom`: number (50-300)
- `showRuler`: boolean
- `showGridlines`: boolean
- `scrollMode`: "vertical" | "horizontal"

Global (preferences):
- `defaultViewMode`: for new notes

### View Mode Behavior
| Mode | Description |
|------|-------------|
| Read | Current markdown rendering |
| Draft | Plain textarea, no styling |
| Print | Page sheets with shadows, numbers, margins from Layout tab |
| Outline | Headings only, collapsible tree |
| Immersive | Full-screen, large text, line focus, speech synthesis |

### Components
1. **NavigationPane** - Side panel with heading tree + find input
2. **ZoomControl** - Slider + preset buttons (100%, One Page, Multiple Pages, Page Width)
3. **Ruler** - Horizontal bar showing page width/margins
4. **Gridlines** - CSS overlay grid
5. **PrintLayoutView** - Renders note as page sheets
6. **OutlineView** - Collapsible heading tree
7. **ImmersiveReaderView** - Full-screen reader with speech

## Implementation Order
1. Extend ViewTab with all controls
2. Add viewMode state and storage to NotePage
3. Implement NavigationPane component
4. Implement PrintLayoutView
5. Implement OutlineView
6. Implement ImmersiveReaderView
7. Add zoom, ruler, gridlines, scroll mode
8. Wire everything together

## Risks
- Print Layout needs page dimensions from Layout tab settings
- Immersive Reader speech synthesis may not work in Tauri (need to test)
- Outline needs heading extraction from markdown
- Per-note storage adds to note.style object size