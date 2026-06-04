import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let publicClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createPublicClient() {
  if (publicClient) {
    return publicClient;
  }

  publicClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
    },
  );

  return publicClient;
}
