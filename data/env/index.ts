export * from './env.server';
export * from './env.client';

// Combined environment (be careful with server-only variables)
import { serverEnv } from './env.server';
import { clientEnv } from './env.client';

export const env = {
  ...clientEnv,
  ...serverEnv,
};

export default env;
