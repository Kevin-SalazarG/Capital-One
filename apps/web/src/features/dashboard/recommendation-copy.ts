import type { Dashboard } from "@/lib/api/contracts";

export function recommendationTitle(
  recommendation: NonNullable<Dashboard["recommendation"]>,
) {
  const collect = /^Collect (?:from )?(.+) before /.exec(recommendation.title);
  if (collect?.[1]) return `Anticipa el cobro de ${collect[1]}`;
  const payment = /^Schedule (.+) after /.exec(recommendation.title);
  if (payment?.[1]) return `Revisa el plazo de pago a ${payment[1]}`;
  if (recommendation.title.startsWith("Increase the cash buffer"))
    return "Refuerza tu reserva de efectivo";
  if (/^(Reschedule|Negotiate|Delay)/.test(recommendation.title))
    return "Revisa el plazo de este pago";
  return recommendation.title;
}
