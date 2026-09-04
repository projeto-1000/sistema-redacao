export function buildEssayCorrectionUrl(
  studentsAppUrl: string,
  essayId: string
): string {
  const normalizedBaseUrl = studentsAppUrl.replace(/\/+$/, "");

  return `${normalizedBaseUrl}/minhas-redacoes/${encodeURIComponent(essayId)}`;
}
