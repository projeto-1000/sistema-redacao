type CsvColumn<T> = {
  header: string;

  key: keyof T | ((row: T) => string); 
};

export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  const headers = columns.map((c) => `"${c.header}"`).join(",");

  const rows = data.map((row) => {
    return columns
      .map((c) => {
        const value = typeof c.key === "function" ? c.key(row) : row[c.key as keyof T];
        const safeValue = String(value ?? "").replace(/"/g, '""');
        return `"${safeValue}"`;
      })
      .join(",");
  });

  return "\uFEFF" + [headers, ...rows].join("\n");
}