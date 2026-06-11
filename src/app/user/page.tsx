import { UserProfileShell } from "@/components/user/user-profile-shell";
import { createClient } from "@/lib/supabase/server";
import {
  createGuestUserArchivePageData,
  getUserArchivePageData,
} from "@/lib/user-archive/data";

export const dynamic = "force-dynamic";

type UserPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function UserPage({ searchParams }: UserPageProps) {
  const rawSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const data = user
    ? await getUserArchivePageData(supabase, user.id, rawSearchParams, user.email)
    : createGuestUserArchivePageData(rawSearchParams);

  return <UserProfileShell data={data} />;
}
