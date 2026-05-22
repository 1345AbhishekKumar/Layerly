# Project Updates & Bug Fixes

## 1. Resolved TypeScript Error in PropertiesPanel.tsx

**Problem:**
A Next.js build failure occurred due to a type mismatch in `components/PropertiesPanel.tsx`. The `canvas.fire('selection:updated', ...)` calls were missing the required `deselected` property. In Fabric.js v7, this event expects both `selected` and `deselected` arrays of objects.

**Solution:**
- Updated the **Grouping** logic to include `deselected: [activeSelection]` when a new group is created from a selection.
- Updated the **Ungrouping** logic to include `deselected: [group]` when a group is broken down into constituent objects.
- Verified the fix by running a full production build (`npm run build`), which now passes successfully.

## 2. Fixed Clerk Image Configuration Error

**Problem:**
A runtime error occurred when attempting to render user avatars from Clerk:
`Invalid src prop (https://img.clerk.com/...) on next/image, hostname "img.clerk.com" is not configured under images in your next.config.js`.

**Solution:**
- Updated `next.config.ts` to include `img.clerk.com` and `images.clerk.dev` in the `images.remotePatterns` configuration.
- This allows Next.js to securely optimize and serve images from Clerk's infrastructure.

