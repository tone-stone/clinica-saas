import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary/client";
import { getCurrentTenant } from "@/lib/tenant/current-tenant";
import { getCurrentMembership } from "@/lib/tenant/get-membership";

// Firma para subir adjuntos clínicos directo a Cloudinary desde el navegador
// (el API secret nunca sale del servidor). Solo staff/owner puede subir.
export async function POST() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const membership = await getCurrentMembership(tenant.id);
  if (!membership || membership.role === "patient") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `tenants/${tenant.id}`;
  const paramsToSign = { timestamp, folder, type: "authenticated" };
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    type: "authenticated",
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
