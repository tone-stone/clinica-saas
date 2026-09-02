"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updatePatientPhoto } from "@/lib/actions/patients";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function PatientPhotoUpload({
  patientId,
  patientName,
  photoUrl,
}: {
  patientId: string;
  patientName: string;
  photoUrl: string | null;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/uploads/sign", { method: "POST" });
      if (!signRes.ok) throw new Error("No se pudo firmar la subida");
      const sign = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sign.apiKey);
      formData.append("timestamp", String(sign.timestamp));
      formData.append("signature", sign.signature);
      formData.append("folder", sign.folder);
      formData.append("type", sign.type);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("No se pudo subir la foto");
      const uploaded = await uploadRes.json();

      const result = await updatePatientPhoto({ patientId, publicId: uploaded.public_id });
      if (result.error) throw new Error(result.error);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la foto");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Cambiar foto del paciente"
      >
        <Avatar size="lg" className="size-16">
          {photoUrl && <AvatarImage src={photoUrl} alt={patientName} />}
          <AvatarFallback className="text-base">{initialsOf(patientName)}</AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white">
          {isUploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Camera className="size-5" />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
