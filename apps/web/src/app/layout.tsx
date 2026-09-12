import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Colchón — Llega a tu próxima nómina",
    template: "%s · Colchón",
  },
  description:
    "Anticipa faltantes de caja, compara acuerdos y protege los pagos que no pueden esperar.",
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
