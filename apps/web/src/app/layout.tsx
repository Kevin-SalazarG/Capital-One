import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Colchón — Anticipa la caja de tu obra",
    template: "%s · Colchón",
  },
  description:
    "Anticipa faltantes de caja en pequeñas constructoras y recibe un plan de acción antes de poner en riesgo la nómina.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
