import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    GEMINI_API_KEY: z.string().min(1),
  },
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
