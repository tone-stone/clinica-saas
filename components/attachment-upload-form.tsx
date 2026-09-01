"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createAttachment } from "@/lib/actions/attachments";

export function AttachmentUploadForm({ patientId }: { patientId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("No se pudo firmar la subida");
      const sign = await signRes.json();

      const resourceType = file.type.startsWith("image/") ? "image" : "raw";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sign.apiKey);
      formData.append("timestamp", String(sign.timestamp));
      formData.append("signature", sign.signature);
      formData.append("folder", sign.folder);
      formData.append("type", sign.type);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/${resourceType}/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("No se pudo subir el archivo a Cloudinary");
      const uploaded = await uploadRes.json();

      const result = await createAttachment({
        patientId,
        publicId: uploaded.public_id,
        resourceType,
        originalFilename: file.name,
      });
      if (result.error) throw new Error(result.error);

      setFile(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir el archivo");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button type="button" onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? "Subiendo…" : "Subir"}
        </Button>
      </div>
    </div>
  );
}
