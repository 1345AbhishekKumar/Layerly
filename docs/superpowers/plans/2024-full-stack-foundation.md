# Full-Stack Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the full-stack foundation by integrating Prisma + PostgreSQL for data persistence, syncing Clerk users via webhooks, and setting up Vercel Blob for file storage.

**Architecture:** 
- A PostgreSQL database managed by Prisma ORM.
- A Clerk Webhook handler (`app/api/webhooks/clerk/route.ts`) verified by `svix` that upserts user data into the database.
- Vercel Blob integrated for server-side upload handlers.

**Tech Stack:** Next.js (App Router), Prisma, PostgreSQL, Clerk, Svix, @vercel/blob

---

### Task 1: Install Dependencies & Initialize Prisma

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `.env.example`

- [ ] **Step 1: Install Prisma, Svix, and Vercel Blob**

Run: `npm install @prisma/client svix @vercel/blob`
Run: `npm install -D prisma`

- [ ] **Step 2: Initialize Prisma**

Run: `npx prisma init`
Expected: `prisma/schema.prisma` and `.env` are created.

- [ ] **Step 3: Define User Schema**

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

- [ ] **Step 4: Update Environment Variables Example**

Modify or create `.env.example`:
```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"

# Clerk Webhook Secret
CLERK_WEBHOOK_SECRET=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma .env.example .env
git commit -m "chore: initialize prisma and add dependencies"
```

### Task 2: Setup Prisma Client Singleton

**Files:**
- Create: `lib/prisma.ts`

- [ ] **Step 1: Create Prisma global instance**

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

- [ ] **Step 2: Commit**

```bash
git add lib/prisma.ts
git commit -m "chore: setup prisma client singleton"
```

### Task 3: Implement Clerk Webhook Route Handler

**Files:**
- Create: `app/api/webhooks/clerk/route.ts`

- [ ] **Step 1: Create the Webhook Route**

Create `app/api/webhooks/clerk/route.ts`:
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
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
  
  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    if (id) {
       await prisma.user.delete({
         where: { id }
       });
    }
  }

  return NextResponse.json({ message: 'Webhook processed' }, { status: 200 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/webhooks/clerk/route.ts
git commit -m "feat: add clerk webhook handler for user syncing"
```

### Task 4: Implement Vercel Blob Upload Server Action

**Files:**
- Create: `app/actions/upload.ts`

- [ ] **Step 1: Create Vercel Blob action**

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

- [ ] **Step 2: Commit**

```bash
git add app/actions/upload.ts
git commit -m "feat: add vercel blob upload server action"
```
