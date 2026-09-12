"use client";
import { ErrorView } from "@/components/feedback";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="page-container">
      <ErrorView error={error} retry={reset} />
    </main>
  );
}
