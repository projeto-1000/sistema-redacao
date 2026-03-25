
type CsvColumn<T> = {
  header: string;
  // A chave pode ser o nome da propriedade no banco ou uma função para formatar (ex: data, status)
  key: keyof T | ((row: T) => string); 
};

export function generateCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  // 1. Gera o cabeçalho
  const headers = columns.map((c) => `"${c.header}"`).join(",");

  // 2. Gera as linhas iterando sobre os dados
  const rows = data.map((row) => {
    return columns
      .map((c) => {
        const value = typeof c.key === "function" ? c.key(row) : row[c.key as keyof T];
        // Escapa aspas duplas dentro do texto para não quebrar o CSV e garante que null vire string vazia
        const safeValue = String(value ?? "").replace(/"/g, '""');
        return `"${safeValue}"`;
      })
      .join(",");
  });

  // 3. Junta tudo. 
  // O \uFEFF é o BOM (Byte Order Mark) do UTF-8, essencial para o Excel abrir com os acentos (ã, é, ç) certos.
  return "\uFEFF" + [headers, ...rows].join("\n");
}