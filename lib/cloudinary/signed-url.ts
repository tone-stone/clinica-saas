import "server-only";
import { cloudinary } from "./client";
import type { AttachmentResourceType } from "@/lib/supabase/database.types";

/**
 * URL firmada para un asset con delivery type "authenticated" (documentos
 * clínicos: nunca públicos). La firma prueba que la generó nuestro backend
 * con el API secret; para expiración real por tiempo hace falta habilitar
 * "Token-based authentication" en Cloudinary (mejora de fase 2).
 */
export function getAuthenticatedAssetUrl(
  publicId: string,
  resourceType: AttachmentResourceType
): string {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
}
