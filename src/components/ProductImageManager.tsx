"use client";

import { useState } from "react";
import api from "@/lib/api"; // 👈 ya usando tu cliente axios default export

type Props = {
  productId: number;
  imagenUrl?: string | null;
  imagenPublicId?: string | null;
  onChanged?: () => void;
};

export default function ProductImageManager({
  productId,
  imagenUrl,
  imagenPublicId: _imagenPublicId,
  onChanged,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/productos/${productId}/imagen`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChanged?.();
      setFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error?.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setBusy(false);
    }
  };

  const removeImage = async () => {
    if (!confirm("¿Eliminar imagen actual?")) return;
    setBusy(true);
    try {
      await api.delete(`/productos/${productId}/imagen`);
      onChanged?.();
    } catch (error: any) {
      console.error('Error removing image:', error);
      alert(error?.response?.data?.message || 'Error al eliminar la imagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={onSelect} />
        <button
          onClick={upload}
          disabled={!file || busy}
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {busy ? "Procesando..." : "Subir / Reemplazar"}
        </button>
        {imagenUrl && (
          <button
            onClick={removeImage}
            disabled={busy}
            className="px-3 py-2 rounded border border-red-500 text-red-600 disabled:opacity-50"
          >
            Eliminar
          </button>
        )}
      </div>

      <div>
        {preview ? (
          <img src={preview} alt="preview" className="max-w-xs rounded" />
        ) : imagenUrl ? (
          <img src={imagenUrl} alt="producto" className="max-w-xs rounded" />
        ) : (
          <p className="text-sm text-gray-500">Sin imagen</p>
        )}
      </div>
    </div>
  );
}
