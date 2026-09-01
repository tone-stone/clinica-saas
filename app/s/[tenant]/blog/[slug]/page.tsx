import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";

export default async function TenantBlogPostPage({
  params,
}: {
  params: Promise<{ tenant: string; slug: string }>;
}) {
  const { tenant: subdomain, slug } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!post) notFound();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold">{post.title}</h1>
      {post.published_at && (
        <p className="mt-2 text-sm text-muted-foreground">
          {new Date(post.published_at).toLocaleDateString("es")}
        </p>
      )}
      <div className="prose mt-8 whitespace-pre-wrap">{post.content}</div>
    </main>
  );
}
