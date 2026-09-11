# PhishGuard Nexus — Customization & Styling Architecture

## Overview
PhishGuard Nexus features a dynamic preferences engine (`PreferencesContext.jsx`) that applies CSS variables and tokens directly to `document.documentElement`, ensuring zero layout breakdown and instant visual response.

## Styling Engine Architecture
- **Theme Attribute**: `[data-theme="nexus-dark | midnight | carbon | high-contrast"]`
- **Accent Attribute**: `[data-accent="cyan | blue | purple | green | amber"]`
- **Density Attribute**: `[data-density="compact | comfortable | spacious"]`
- **Text Size Attribute**: `[data-text-size="small | default | large | extra-large"]`
- **Accessibility Classes**: `.reduce-motion`, `.high-contrast`, `.focus-indicators`
- **Futuristic Effect Classes**: `.grid-bg`, `.glow-effects`

## Persistence & Workspace Synchronization
User preferences are stored persistently in `localStorage` (`phishguard_nexus_prefs`). Preferences can be exported to a clean JSON string or imported with schema validation and sanitization. Resetting settings restores default UI options without modifying SQLite database records for scans or cases.
