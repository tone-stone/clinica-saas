import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/tenant/get-tenant";

export default async function BlogAdminPage({
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
    .select("id, title, status, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Blog</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El editor de publicaciones es trabajo de fase 2. La tabla <code>blog_posts</code> y sus
        políticas ya existen; esto solo lista lo que haya en la base de datos.
      </p>
      <div className="mt-6 space-y-2">
        {posts?.map((post) => (
          <div key={post.id} className="rounded-lg border p-4">
            <p className="font-medium">{post.title}</p>
            <p className="text-xs text-muted-foreground">{post.status}</p>
          </div>
        ))}
        {(!posts || posts.length === 0) && (
          <p className="text-sm text-muted-foreground">Sin publicaciones todavía.</p>
        )}
      </div>
    </div>
  );
}
