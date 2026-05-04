# Changelog

## [0.1.1] - 2026-05-04

### Added
- **Cursor AI integration**: Full support for Cursor editor with official Harness Cursor Plugin
  - Auto-detection of Cursor installation and Harness Plugin
  - OAuth authentication detection for plugin-based MCP
  - Auto-paste functionality for seamless prompt delivery
  - Fallback to local MCP configuration (harness-mcp-v2)
  - Official Cursor cube logo in AI tool picker
- **Configurable logging system**: Production-grade log level control
  - New VS Code setting `harness.logLevel` with 5 levels (off/error/warn/info/debug)
  - Centralized logger utility (`src/utils/logger.ts`)
  - Applied to extension host and pipeline dispatcher modules
  - Default: `info` level (recommended for production)

### Fixed
- AI bar "Thinking..." animation now displays correctly during Claude CLI requests
- AI response scroll position preserved during re-renders (no more jumping to top)
- AI bar state now correctly reflects selected tool (Cursor vs Claude Code)

### Removed
- AIDA root cause analysis API calls (endpoint returns 404, commented out for future re-enable)
- STO vulnerability findings API calls (deferred to future implementation)
- Design handoff assets from repository (`handoff/` directory)

### Changed
- `.gitignore` updated to exclude test files and design assets
- Added `.vscode/launch.json` and `.vscode/tasks.json` for developer setup

## [0.1.0] - 2026-04-26

### Added
- Sidebar panel with live pipeline execution status for current git branch and commit
- Two view modes: "This commit" (live) and "All executions" (history with pagination and filters)
- Detail view with on-demand log fetching and live polling for running executions
- CI log fetching via blob/download (ZIP) with stream fallback
- Stage and step traversal from Harness execution graph
- Expanded log viewer: opens logs in editor tabs with syntax highlighting (TextMate grammar)
- Module support: CI, CD, STO, TI, SSCA, OPA, CCM, AIDA
- STO, TI, and SSCA diagnostics surfaced in VS Code Problems panel
- Harness native approval flow with user/group permission checks
- External approval support (Jira, ServiceNow) with ticket links
- Dual theme system: simple (VS Code tokens) and enhanced (OKLCH cards UI), gated by FME
- Light/dark theme auto-detection for enhanced theme
- App menu drawer with product navigation and account switching
- Feature Management Engine (FME) integration via Split.io SDK for controlled rollouts
- Two-phase onboarding: global API key + per-workspace org/project selection
- AI integration: Claude Code CLI and Extension detection, MCP auto-configuration
- Default view pinning with persistent preference
- Export execution to JSON for debugging
- Debug output channel for API inspection
- Walkthrough for first-time setup
