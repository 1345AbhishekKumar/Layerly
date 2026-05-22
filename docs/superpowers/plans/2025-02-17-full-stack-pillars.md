# Full-Stack Mastery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current frontend into a full-stack application by implementing data persistence, authentication syncing, cloud storage, payments, background processing, and rate limiting.

**Architecture:**
- **Database:** Prisma ORM with PostgreSQL for structured data.
- **Auth Sync:** Clerk Webhooks to keep user data in the local DB.
- **Storage:** Vercel Blob for performant image and asset hosting.
- **Payments:** Stripe for subscription and credit management.
- **Background Jobs:** Inngest for reliable, event-driven workflows.
- **Rate Limiting:** Upstash Redis for edge-based API protection.

**Tech Stack:** Next.js, Prisma, PostgreSQL, Clerk, Vercel Blob, Stripe, Inngest, Upstash Redis.

---

### Task 1: Database & User Sync (Prisma + Clerk Webhooks)

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `app/api/webhooks/clerk/route.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install Prisma and Svix**
Run: `npm install @prisma/client svix && npm install -D prisma`

- [ ] **Step 2: Initialize Prisma and define User model**
Run: `npx prisma init`
Expected: `prisma/schema.prisma` created. Update it with:
```prisma
model User {
  id        String   @id
  email     String   @unique
  firstName String?
  lastName  String?
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 3: Setup Prisma Client Singleton**
Create `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
const prismaClientSingleton = () => new PrismaClient()
declare const globalThis: { prismaGlobal: ReturnType<typeof prismaClientSingleton> } & typeof global;
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
export default prisma
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
```

- [ ] **Step 4: Implement Clerk Webhook handler**
Create `app/api/webhooks/clerk/route.ts` with verification logic using `svix` and Prisma upsert for `user.created` and `user.updated`.

- [ ] **Step 5: Commit**
```bash
git add prisma/ lib/ prisma.ts app/api/webhooks/clerk/
git commit -m "feat: setup prisma and clerk webhook for user syncing"
```

### Task 2: Storage & Server Actions (Vercel Blob)

**Files:**
- Create: `app/actions/storage.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install @vercel/blob**
Run: `npm install @vercel/blob`

- [ ] **Step 2: Create Storage Server Actions**
Create `app/actions/storage.ts`:
```typescript
'use server'
import { put } from '@vercel/blob';
export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  const blob = await put(file.name, file, { access: 'public' });
  return blob.url;
}
```

- [ ] **Step 3: Commit**
```bash
git add app/actions/storage.ts
git commit -m "feat: add vercel blob storage actions"
```

### Task 3: Payments (Stripe Integration)

**Files:**
- Create: `lib/stripe.ts`
- Create: `app/api/webhooks/stripe/route.ts`
- Create: `app/actions/stripe.ts`

- [ ] **Step 1: Install Stripe**
Run: `npm install stripe`

- [ ] **Step 2: Initialize Stripe Client**
Create `lib/stripe.ts` using `STRIPE_SECRET_KEY`.

- [ ] **Step 3: Implement Webhook handler**
Create `app/api/webhooks/stripe/route.ts` to handle `checkout.session.completed`.

- [ ] **Step 4: Commit**
```bash
git add lib/stripe.ts app/api/webhooks/stripe/ app/actions/stripe.ts
git commit -m "feat: implement stripe payments and webhooks"
```

### Task 4: Background Jobs & Rate Limiting (Inngest + Upstash)

**Files:**
- Create: `inngest/client.ts`, `inngest/functions.ts`
- Create: `app/api/inngest/route.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Install Inngest and Upstash**
Run: `npm install inngest @upstash/ratelimit @upstash/redis`

- [ ] **Step 2: Setup Inngest**
Create `inngest/client.ts` and `app/api/inngest/route.ts` to serve background functions.

- [ ] **Step 3: Implement Rate Limiting Middleware**
Create `middleware.ts` to limit `/api` requests using Upstash Redis.

- [ ] **Step 4: Commit**
```bash
git add inngest/ app/api/inngest/ middleware.ts
git commit -m "feat: add inngest background jobs and upstash rate limiting"
```
