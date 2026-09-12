import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-content-center gap-5 p-6 text-center">
      <h1 className="page-title">Esta página no está aquí</h1>
      <p className="text-muted-foreground">
        Puedes volver al resumen de tu negocio.
      </p>
      <Button asChild>
        <Link href="/app">Volver al resumen</Link>
      </Button>
    </main>
  );
}
