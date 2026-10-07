/** Access lasts through the existing final calendar day in São Paulo, not UTC. */
export function getSubscriptionAccessEnd(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error("Invalid subscription period end");
  const day = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(date);
  return new Date(`${day}T23:59:59.999-03:00`).toISOString();
}
