# Progress Tracker

Update this file whenever the current phase, active feature , or implementation state changes

## Current Phase

- Core Architecture Refactoring & State Management Optimization

## Current Goal

- Enhance data fetching and local persistence using TanStack Query while maintaining UI state in Zustand.

## Completed

- **TanStack Query Integration**: Set up `QueryProvider` with 2025 best practices for Next.js App Router.
- **AI Assistant Refactor**: Switched manual state management to `useMutation` in `AIAssistantTab`.
- **Gallery Logic Refactor**: Replaced `useEffect` based loading in `useGallery` with `useQuery` and `useMutation`.
- **Gallery UI Enhancement**: Added loading/syncing states to the Gallery Modal for better UX.
- **State Separation**: Clearly defined roles for TanStack Query (Server/Async state) and Zustand (Client/Canvas state).
- **Fabric.js v7 Build Fix**: Resolved TypeScript errors in `PropertiesPanel.tsx` related to `selection:updated` event signatures.

## In Progress

- Refinement of AI interaction patterns.

## Next Up

- Optimistic updates for gallery operations.
- Performance profiling of canvas operations with the new state management.

## Open Questions

- Should we implement a "Drafts" system in TanStack Query to persist unsaved canvas states?

## Architecture Decisions

- **TanStack Query vs Zustand**: TanStack Query handles all asynchronous operations (Disk I/O, AI APIs, Caching). Zustand handles the synchronous "live" canvas state (Brush size, active objects, UI toggles).
- **Client/Server QueryClient**: Implemented a singleton pattern for the QueryClient to prevent cache resets in the App Router.

## Session Notes

- Integrated TanStack Query to replace manual `useEffect` and `useState` for data fetching.
- Refactored `AIAssistantTab` and `useGallery` to demonstrate the new pattern.
- Verified that design and existing logic remain intact.

