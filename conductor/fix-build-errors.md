# Implementation Plan: Fix Build and Lint Errors

## Objective
Resolve the ESLint `TypeError` and multiple TypeScript type errors related to `fabric.js` v7 API changes (e.g., `addWithUpdate`, `setBackgroundColor`, `fromURL`, `loadFromJSON`, stack order methods, `toJSON`), allowing the project to build and lint successfully.

## Key Files & Context
- `package.json`: Contains the incompatible `eslint` version (10.4.0).
- `components/Editor.tsx`, `components/LayersPanel.tsx`, `components/editor/AIAssistantTab.tsx`: Contain deprecated `fabric.js` v5 methods being used with v7.
- `hooks/use-history.ts`, `hooks/use-autosave.ts`: Contain deprecated `loadFromJSON` and `toJSON` usage.
- `lib/fabric-utils.ts`: Contains deprecated stack order and `insertAt` usage.

## Implementation Steps
1. **Downgrade ESLint** (Completed)
   - Changed `eslint` devDependency from `"10.4.0"` to `"^9.14.0"` in `package.json`.

2. **Fix Fabric API Usage - Group.add** (Completed)
   - Replaced `addWithUpdate(path)` with `add(path)` in `components/Editor.tsx`.

3. **Fix Fabric API Usage - Canvas Background** (Completed)
   - Replaced `canvas.setBackgroundColor(color, callback)` with `canvas.backgroundColor = color;` in `components/Editor.tsx`.

4. **Fix Fabric API Usage - fromURL Promise** (Completed)
   - Replaced `fabric.Image.fromURL(url, (img) => { ... })` with `fabric.FabricImage.fromURL(url).then((img) => { ... })` across:
     - `components/Editor.tsx`
     - `components/LayersPanel.tsx`
     - `components/editor/AIAssistantTab.tsx`

5. **Fix Fabric API Usage - loadFromJSON Promise** (Completed)
   - Replaced `canvas.loadFromJSON(json, () => { ... })` with `canvas.loadFromJSON(json).then(() => { ... })` across:
     - `components/Editor.tsx`
     - `hooks/use-history.ts`
     - `hooks/use-autosave.ts`

6. **Fix Fabric API Usage - Stack Order Methods** (Completed)
   - Replaced object methods with canvas methods:
     - `obj.sendToBack()` -> `canvas.sendObjectToBack(obj)`
     - `obj.bringToFront()` -> `canvas.bringObjectToFront(obj)`
     - `obj.sendBackwards()` -> `canvas.sendObjectBackwards(obj)`
     - `obj.bringForward()` -> `canvas.bringObjectForward(obj)`
     - `obj.moveTo(index)` -> `canvas.moveObjectTo(obj, index)`
   - Fixed `canvas.insertAt(obj, index)` in `lib/fabric-utils.ts`.

7. **Fix Fabric API Usage - toJSON vs toObject**
   - Replace `canvas.toJSON(propertiesToInclude)` with `canvas.toObject(propertiesToInclude)` across:
     - `components/Editor.tsx`
     - `hooks/use-history.ts`
     - `hooks/use-autosave.ts`
   - Note: `toJSON()` no longer accepts arguments in v7, while `toObject()` does.

## Verification
- Run `bun install` to ensure ESLint matches.
- Run `bun run lint` and verify it succeeds.
- Run `bun run tsc --noEmit` and `bun run build` to ensure all Fabric.js type errors are gone and the build completes.