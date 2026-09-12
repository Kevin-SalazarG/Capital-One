import { Badge } from "@/components/ui/badge";
import type { Invoice } from "@/lib/api/contracts";
import { PAYMENT_LABELS } from "@/lib/formatters";
import { cn } from "@/lib/class-names";

export function InvoicePaymentStatus({
  invoice,
  className,
}: {
  invoice: Invoice;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        invoice.paymentStatus === "overdue"
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : invoice.paymentStatus === "paid"
            ? "border-primary/20 bg-secondary text-primary"
            : "text-muted-foreground",
        className,
      )}
    >
      {PAYMENT_LABELS[invoice.paymentStatus]}
    </Badge>
  );
}
