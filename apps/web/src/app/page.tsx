import type { Metadata } from "next";
import { LandingPage } from "@/features/marketing/landing-page";

export const metadata: Metadata = {
  title: "Anticipa la caja de tu obra",
  description:
    "Colchón convierte tus CFDI, movimientos y pagos de obra en una vista clara de los próximos 30 días.",
};

export default function HomePage() {
  return <LandingPage />;
}
