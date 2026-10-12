"use client";

import { useActionState, useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  updateOrderStatus,
  type StatusActionState,
} from "@/app/(admin)/admin/commandes/actions";
import { NEXT_STATUS, type OrderStatus } from "@/lib/order-status";

// À utiliser avec key={status} : l'état interne repart de zéro après chaque changement.
export function OrderStatusActions({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [state, formAction, pending] = useActionState<
    StatusActionState,
    FormData
  >(updateOrderStatus, null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { primary, cancellable } = NEXT_STATUS[status];

  if (!primary && !cancellable) {
    return (
      <p className="text-sm text-ink-soft">
        Cette commande est terminée : son statut ne peut plus changer.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />

      {status === "pending_payment" && (
        <p className="rounded-2xl bg-vanilla/80 p-4 text-sm text-ink">
          En attente du paiement du client. La commande passera à « Payée »
          automatiquement quand le paiement sera confirmé.
        </p>
      )}

      {primary && (
        <button
          type="submit"
          name="status"
          value={primary.status}
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-cocoa text-sm font-medium text-cream transition-transform motion-safe:active:scale-95 disabled:opacity-70"
        >
          {pending && (
            <LoaderCircle
              className="size-4 motion-safe:animate-spin"
              aria-hidden="true"
            />
          )}
          {primary.label}
        </button>
      )}

      {cancellable && !confirmCancel && (
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          className="flex h-11 w-full items-center justify-center rounded-full border border-line text-sm font-medium text-ink transition-colors hover:bg-rose/60"
        >
          Annuler la commande
        </button>
      )}

      {cancellable && confirmCancel && (
        <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Confirmer l&apos;annulation ? Cette action est définitive. Si la
            commande est déjà payée, le remboursement est à traiter séparément.
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              name="status"
              value="cancelled"
              disabled={pending}
              className="h-10 flex-1 rounded-full bg-red-700 text-sm font-medium text-white transition-transform motion-safe:active:scale-95 disabled:opacity-70"
            >
              Oui, annuler
            </button>
            <button
              type="button"
              onClick={() => setConfirmCancel(false)}
              className="h-10 flex-1 rounded-full border border-line bg-surface text-sm font-medium text-ink"
            >
              Non, garder
            </button>
          </div>
        </div>
      )}

      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}