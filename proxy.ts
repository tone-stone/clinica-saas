import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { extractSubdomain } from "@/lib/tenant/resolve";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

// Rutas dentro de un tenant que no requieren sesión iniciada.
const PUBLIC_TENANT_PATHS = ["/login", "/registro-invitacion", "/blog", "/suscripcion-inactiva"];

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(hostname, ROOT_DOMAIN);
  const { pathname } = request.nextUrl;

  // x-tenant-subdomain se agrega a los HEADERS DE LA PETICIÓN (no de la
  // respuesta): así queda disponible vía `headers()` en Server Components y
  // Server Actions, que es donde lib/tenant/current-tenant.ts lo lee.
  const requestHeaders = new Headers(request.headers);
  if (subdomain) requestHeaders.set("x-tenant-subdomain", subdomain);

  const targetUrl = request.nextUrl.clone();
  if (subdomain) {
    targetUrl.pathname = `/s/${subdomain}${pathname}`;
  }

  const buildResponse = () =>
    subdomain
      ? NextResponse.rewrite(targetUrl, { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  let response = buildResponse();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = buildResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() (no getSession()) valida el token contra Supabase Auth y refresca cookies si hace falta.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (subdomain) {
    const isPublicPath = PUBLIC_TENANT_PATHS.some((p) => pathname.startsWith(p));
    if (!user && !isPublicPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
  } else if (pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
