# Implementation Plan: Compact Select and Popover Components

## Overview
Replace all select boxes and "..." popovers with compact, shared components that are smaller (24px height closed, 26px row height open) and auto-width (never full-width). Create a new `SelectCompact` component and update the ribbon group "..." popover to use a compact grid of icon buttons.

## Architecture Decisions
1. **New shared component**: Create `src/components/ui/select-compact.jsx` with the compact design specs
2. **New shared popover content**: Create `src/components/ui/compact-popover.jsx` for the ribbon "..." popover
3. **Update RibbonKit's RibbonSelect** to use the new compact select
4. **Update RibbonGroup** to use the new compact popover for "more" content
5. **Replace all direct Select usages** in the codebase with the new compact version

## Task List

### Phase 1: Create New Compact Components
- [ ] **Task 1**: Create `src/components/ui/select-compact.jsx` - Compact select component (24px closed, 26px rows, auto-width, max 8 visible rows, check mark on selected, small chevron, down arrow only when scrolling)
- [ ] **Task 2**: Create `src/components/ui/compact-popover.jsx` - Compact popover content for ribbon "..." (3-4 icon buttons per row, 28px each, tooltips, max 240px width, compact rows for selects/steppers)

### Phase 2: Update Ribbon Core Components
- [ ] **Task 3**: Update `src/components/ribbon/RibbonKit.jsx` - Modify `RibbonSelect` to use `SelectCompact`
- [ ] **Task 4**: Update `src/components/ribbon/RibbonGroup.jsx` - Replace popover content with compact popover for "more" items
- [ ] **Task 5**: Update `src/components/ui/popover.jsx` - Ensure it supports the compact sizing

### Phase 3: Replace Select Usages in Settings
- [ ] **Task 6**: Update `src/pages/SettingsPage.jsx` - Replace local `Select` wrapper with `SelectCompact` (18+ select usages)

### Phase 4: Replace Select Usages in Ribbon Tabs
- [ ] **Task 7**: Update `src/components/ribbon/tabs/DesignTab.jsx` - Uses `RibbonSelect` (already updated via RibbonKit) - verify
- [ ] **Task 8**: Update `src/components/ribbon/tabs/HomeTab.jsx` - Uses both `RibbonSelect` and direct `Select` - replace direct `Select` with `SelectCompact`
- [ ] **Task 9**: Update `src/components/ribbon/tabs/InkTabs.jsx` - Uses `RibbonSelect` - verify
- [ ] **Task 10**: Update `src/components/ribbon/tabs/LayoutTab.jsx` - Uses `RibbonSelect` - verify

### Phase 5: Replace Select Usages in Pages
- [ ] **Task 11**: Update `src/pages/NotePage.jsx` - Replace direct `Select` for zoom and folder with `SelectCompact`
- [ ] **Task 12**: Update `src/pages/TablePage.jsx` - Replace direct `Select` with `SelectCompact`
- [ ] **Task 13**: Update `src/pages/CodePage.jsx` - Replace direct `Select` with `SelectCompact`
- [ ] **Task 14**: Update `src/components/cards/CardForm.jsx` - Replace direct `Select` with `SelectCompact`
- [ ] **Task 15**: Update `src/components/table/TableGrid.jsx` - Replace direct `Select` with `SelectCompact`
- [ ] **Task 16**: Update `src/pages/TasksPage.jsx` - Replace direct `Select` with `SelectCompact`
- [ ] **Task 17**: Update `src/components/notes/AiAssist.jsx` - Replace direct `Select` with `SelectCompact`

### Phase 6: Replace DropdownMenu in Vault
- [ ] **Task 18**: Update `src/components/vault/VaultSidebar.jsx` - Replace `DropdownMenu` with compact popover for folder actions

### Phase 7: Testing and Verification
- [ ] **Task 19**: Run lint and build checks
- [ ] **Task 20**: Test at 1920px and 1366px widths, and RTL layout
- [ ] **Task 21**: Run i18n check

## Acceptance Criteria

### SelectCompact
- [ ] Closed box: 24px height, auto-width (content-based), 12px text, small chevron
- [ ] Open list: auto-width (longest item), 26px row height, check mark on selected item
- [ ] Max 8 rows visible, scrollable beyond that
- [ ] Small down arrow at bottom only when list scrolls
- [ ] Solid background, no overflow
- [ ] Keyboard: arrows, Enter, Escape work
- [ ] RTL: works correctly

### CompactPopover (for "..." in ribbon)
- [ ] Grid of icon buttons: 3-4 per row, 28px each
- [ ] Every button has tooltip and accessible name
- [ ] Selects/steppers appear as compact 26px rows with small label
- [ ] Auto width, max 240px
- [ ] RTL: works correctly

### Integration
- [ ] All ribbon tabs use compact selects
- [ ] Settings page uses compact selects
- [ ] Note page zoom/folder use compact selects
- [ ] Table page, Code page, Tasks page use compact selects
- [ ] CardForm, TableGrid, AiAssist use compact selects
- [ ] Vault sidebar folder actions use compact popover

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing select behavior | High | Keep all props and values identical, only change visual styling |
| RTL layout issues | Medium | Test RTL at each phase, use logical CSS properties |
| Keyboard navigation broken | High | Test arrow keys, Enter, Escape thoroughly |
| i18n keys missing | Medium | Run i18n-check after each phase |

## Open Questions
- Should we keep the original `Select` component for any specific use case, or fully replace?
- The `RibbonSelect` in RibbonKit already has custom styling - should it fully adopt SelectCompact or keep some overrides?

## Files to Change
1. `src/components/ui/select-compact.jsx` (NEW)
2. `src/components/ui/compact-popover.jsx` (NEW)
3. `src/components/ribbon/RibbonKit.jsx`
4. `src/components/ribbon/RibbonGroup.jsx`
5. `src/pages/SettingsPage.jsx`
6. `src/pages/NotePage.jsx`
7. `src/pages/TablePage.jsx`
8. `src/pages/CodePage.jsx`
9. `src/components/cards/CardForm.jsx`
10. `src/components/table/TableGrid.jsx`
11. `src/pages/TasksPage.jsx`
12. `src/components/notes/AiAssist.jsx`
13. `src/components/vault/VaultSidebar.jsx`
14. `src/components/ui/popover.jsx` (potential update)