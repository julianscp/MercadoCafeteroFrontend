"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function DecreaseStockButton({
  productId,
  defaultAmount = 1,
  onChanged,
}: {
  productId: number;
  defaultAmount?: number;
  onChanged?: () => void;
}) {
  const [qty, setQty] = useState<number>(defaultAmount);
  const [busy, setBusy] = useState(false);

  const decrease = async () => {
    if (qty <= 0) return;
    setBusy(true);
    try {
      await api.patch(`/products/${productId}/stock/decrease`, { amount: qty });
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
        className="w-20 border rounded px-2 py-1"
      />
      <button
        onClick={decrease}
        disabled={busy || qty <= 0}
        className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
      >
        {busy ? "Aplicando..." : "Quitar stock"}
      </button>
    </div>
  );
}
