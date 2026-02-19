# Roadmap: GitHub Stars 桌面应用

## Overview

Deliver a complete user settings feature for the GitHub Stars desktop application, enabling users to configure refresh intervals and GitHub clone directory through a dedicated settings page with automatic persistence and immediate application to the refresh logic.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: User Settings** - Complete settings UI with backend API and persistence

## Phase Details

### Phase 1: User Settings
**Goal**: Users can configure application settings (refresh interval, clone directory) through a dedicated settings page
**Depends on**: Nothing (first phase)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, PERS-01, PERS-02, API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. User can access settings page by clicking settings icon in header (left of login icon)
  2. User can adjust refresh interval between 0.1-24 hours and see the value persist
  3. User can select a GitHub clone directory through folder picker dialog and see the path update
  4. Settings automatically save to configuration file when user modifies them
  5. Refresh interval changes apply to trending data auto-refresh logic immediately
**Plans**: 2 plans

Plans:
- [ ] 01-01: Backend configuration and API for user settings (refresh interval, clone directory) with persistence
- [ ] 01-02: Frontend settings page UI with auto-save and header navigation

## Progress

**Execution Order:**
Phases execute in numeric order: 2 → 2.1 → 2.2 → 3 → 3.1 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. User Settings | 0/2 | Not started | - |
