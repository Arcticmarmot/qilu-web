import { redirect } from "next/navigation";

export default async function MyPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ current?: string; size?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "posts" });

  if (params.current) {
    query.set("current", params.current);
  }

  if (params.size) {
    query.set("size", params.size);
  }

  redirect(`/profile?${query.toString()}`);
}
