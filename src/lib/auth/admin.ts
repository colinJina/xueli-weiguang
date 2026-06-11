import type { SupabaseClient } from "@supabase/supabase-js";
export const ADMIN_REQUIRED_MESSAGE = "只有管理员可以上传本地视频。";
export async function isAdminUser(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.is_admin);
}
