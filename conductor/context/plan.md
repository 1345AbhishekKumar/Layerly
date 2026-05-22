# Full-Stack Application Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish all 7 pillars of a modern Next.js full-stack application (Database, Server Actions, Blob Storage, Webhooks, Payments, Background Jobs, and Rate Limiting).

**Architecture:** 
- PostgreSQL database managed by Prisma ORM.
- Next.js Server Actions for bridging UI to DB.
- Vercel Blob for storage.
- Clerk Webhooks verified by Svix for auth syncing.
- Stripe for payment processing & webhooks.
- Inngest for event-driven background jobs.
- Upstash (Redis) for edge rate limiting via Next.js Middleware.

**Tech Stack:** Next.js 15, Prisma, PostgreSQL, @vercel/blob, Clerk, Svix, Stripe, Inngest, @upstash/ratelimit

---

### Task 1: Database (Prisma + PostgreSQL)

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`

- [ ] **Step 1: Install Prisma**

Run: `npm install @prisma/client`
Run: `npm install -D prisma`

- [ ] **Step 2: Initialize Prisma & Schema**

Run: `npx prisma init`

Modify `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma lib/prisma.ts .env
git commit -m "feat: setup database with prisma and user schema"
```

### Task 2: Server Actions (Bridging UI & DB)

**Files:**
- Create: `app/actions/users.ts`

- [ ] **Step 1: Create a Server Action for DB interaction**

Create `app/actions/users.ts`:
```typescript
'use server'

import prisma from '@/lib/prisma'

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    })
    return user
  } catch (error) {
    console.error("Failed to fetch user:", error)
    throw new Error("Failed to fetch user")
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions/users.ts
git commit -m "feat: add user server actions"
```

### Task 3: Blob Storage (Vercel Blob)

**Files:**
- Modify: `package.json`
- Create: `app/actions/upload.ts`

- [ ] **Step 1: Install Vercel Blob**

Run: `npm install @vercel/blob`

- [ ] **Step 2: Create Server Action for Uploads**

Create `app/actions/upload.ts`:
```typescript
'use server'

import { put } from '@vercel/blob';

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error('No file provided');
  }

  const blob = await put(file.name, file, {
    access: 'public',
  });

  return blob.url;
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json app/actions/upload.ts
git commit -m "feat: add vercel blob storage action"
```

### Task 4: Webhooks (Clerk Sync)

**Files:**
- Modify: `package.json`
- Create: `app/api/webhooks/clerk/route.ts`

- [ ] **Step 1: Install Svix for webhook verification**

Run: `npm install svix`

- [ ] **Step 2: Create Webhook Route**

Create `app/api/webhooks/clerk/route.ts`:
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return new Response('Missing Secret', { status: 400 })

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    return new Response('Verification Error', { status: 400 })
  }

  const eventType = evt.type;
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    await prisma.user.upsert({
      where: { id },
      update: {
        email: email_addresses[0]?.email_address,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      },
      create: {
        id,
        email: email_addresses[0]?.email_address,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      }
    });
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 })
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json app/api/webhooks/clerk/route.ts
git commit -m "feat: add clerk webhook handler"
```

### Task 5: Payment Gateway (Stripe)

**Files:**
- Modify: `package.json`
- Create: `lib/stripe.ts`
- Create: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Install Stripe SDK**

Run: `npm install stripe`

- [ ] **Step 2: Create Stripe Client**

Create `lib/stripe.ts`:
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27.acacia',
  typescript: true,
})
```

- [ ] **Step 3: Create Stripe Webhook Handler**

Create `app/api/webhooks/stripe/route.ts`:
```typescript
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('Stripe-Signature') as string

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    // Process successful payment
    console.log('Payment successful:', event.data.object)
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json lib/stripe.ts app/api/webhooks/stripe/route.ts
git commit -m "feat: add stripe setup and webhook"
```

### Task 6: Background Jobs (Inngest)

**Files:**
- Modify: `package.json`
- Create: `inngest/client.ts`
- Create: `inngest/functions.ts`
- Create: `app/api/inngest/route.ts`

- [ ] **Step 1: Install Inngest**

Run: `npm install inngest`

- [ ] **Step 2: Initialize Inngest Client & Function**

Create `inngest/client.ts`:
```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "ai-studio-applet" });
```

Create `inngest/functions.ts`:
```typescript
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { event, body: "Hello, World!" };
  },
);
```

- [ ] **Step 3: Create Inngest API Route**

Create `app/api/inngest/route.ts`:
```typescript
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld],
});
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json inngest/ app/api/inngest/route.ts
git commit -m "feat: setup inngest for background jobs"
```

### Task 7: API Rate Limiting (Upstash)

**Files:**
- Modify: `package.json`
- Create: `middleware.ts`

- [ ] **Step 1: Install Upstash Ratelimit & Redis**

Run: `npm install @upstash/ratelimit @upstash/redis`

- [ ] **Step 2: Implement Rate Limiting Middleware**

Create `middleware.ts` in the root (or `/src` if using `src` directory):
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
})

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})

export async function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json middleware.ts
git commit -m "feat: add upstash api rate limiting middleware"
```
