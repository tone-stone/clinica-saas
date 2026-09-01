import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";

export default async function TenantBlogIndexPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return null;

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, published_at")
    .eq("tenant_id", tenant.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold">{tenant.name} — Blog</h1>
      <div className="mt-8 space-y-6">
        {posts?.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="block">
            <p className="text-lg font-medium hover:underline">{post.title}</p>
            {post.published_at && (
              <p className="text-sm text-muted-foreground">
                {new Date(post.published_at).toLocaleDateString("es")}
              </p>
            )}
          </Link>
        ))}
        {(!posts || posts.length === 0) && (
          <p className="text-muted-foreground">Aún no hay publicaciones.</p>
        )}
      </div>
    </main>
  );
}
