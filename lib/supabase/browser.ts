'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser client, anon key only. Used for the password recovery flow, where
 * the session has to be established from a URL fragment on the client before
 * the server can see a cookie.
 */
export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
