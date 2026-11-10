# AI Feature Implementation Plan

## Overview
Add an optional AI feature (off by default) with:
1. Settings > AI: Provider config (OpenAI-compatible endpoint + model + API key), Test connection button
2. Home ribbon tab: AI actions group (Translate, Summarize, Fix grammar, Continue writing, Arabic <-> English quick button)
3. Per-note language setting for spelling/hyphenation
4. Preview panel with Replace, Insert below, Copy
5. Network error handling with toasts

## Files to Create/Modify

### 1. SettingsPage.jsx - Add AI section
- Add new section "ai" to sections array
- Add state for AI config: endpoint, model, apiKey, enabled
- Add Test Connection button with warning modal
- Save to preferences (localStorage)

### 2. src/lib/ai.js (NEW) - AI utility functions
- callAI(prompt, options) - makes API call to configured endpoint
- testConnection() - validates endpoint + key
- buildPrompt(action, text, language) - builds prompts for each action
- handleAIError(error) - converts errors to user-friendly messages

### 3. src/components/ribbon/tabs/AITab.jsx (NEW) or add to HomeTab.jsx
- Add AI group to Home tab with actions
- Each action: sends selected text (or full note) to AI
- Shows preview panel with Replace/Insert below/Copy
- Uses the new ai.js utility

### 4. AiAssist.jsx - Update or replace
- Replace backend function call with direct API call via ai.js
- Keep the same UI but connect to new AI service

### 5. text-style.js - Add language to typography
- Add `language` field to normalizeStyle
- Add language options (en, ar, etc.)

### 6. NotePage.jsx - Pass language to editor/reader
- Ensure language from typography is used for spellCheck/hyphens

### 7. locales/en.json & ar.json - Add translations
- Settings AI section
- Ribbon AI actions
- Preview panel buttons
- Warning messages

## Implementation Order
1. Create ai.js utility
2. Add AI section to SettingsPage.jsx
3. Add AI group to HomeTab.jsx (ribbon)
4. Update AiAssist.jsx to use new API
5. Add language to text-style.js typography
6. Add translations
7. Test and verify