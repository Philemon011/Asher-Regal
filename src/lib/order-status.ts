export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; badge: string }
> = {
  pending_payment: { label: "En attente de paiement", badge: "bg-vanilla text-ink" },
  paid: { label: "Payée", badge: "bg-sage text-ink" },
  preparing: { label: "En préparation", badge: "bg-peach text-ink" },
  ready: { label: "Prête", badge: "bg-lavender text-ink" },
  delivered: { label: "Livrée", badge: "bg-sage text-ink" },
  cancelled: { label: "Annulée", badge: "bg-rose text-ink" },
};

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

// Ce que l'admin peut faire depuis chaque statut (la base impose les mêmes règles).
export const NEXT_STATUS: Record<
  OrderStatus,
  { primary?: { status: OrderStatus; label: string }; cancellable: boolean }
> = {
  pending_payment: { cancellable: true },
  paid: {
    primary: { status: "preparing", label: "Passer en préparation" },
    cancellable: true,
  },
  preparing: {
    primary: { status: "ready", label: "Marquer comme prête" },
    cancellable: true,
  },
  ready: {
    primary: { status: "delivered", label: "Marquer comme livrée" },
    cancellable: true,
  },
  delivered: { cancellable: false },
  cancelled: { cancellable: false },
};

export function isOrderStatus(value: string): value is OrderStatus {
  return Object.hasOwn(ORDER_STATUS, value);
}