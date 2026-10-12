"use client";

import { useFormStatus } from "react-dom";
import { toggleProduct } from "@/app/(admin)/admin/produits/actions";

function SwitchButton({ checked, label }: { checked: boolean; label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={pending}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition-transform after:content-[''] disabled:opacity-60 ${
        checked ? "bg-ink after:translate-x-5" : "bg-line"
      }`}
    />
  );
}

export function ProductToggle({
  productId,
  field,
  checked,
  label,
}: {
  productId: string;
  field: "is_published" | "is_available";
  checked: boolean;
  label: string;
}) {
  return (
    <form action={toggleProduct}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(!checked)} />
      <SwitchButton checked={checked} label={label} />
    </form>
  );
}