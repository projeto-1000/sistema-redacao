export const ESSAY_SOURCE_BUCKET = "essay-originals";

export const ESSAY_SOURCE_ACCEPT = "image/jpeg,image/png,application/pdf";

export const MAX_ESSAY_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ESSAY_IMAGE_BYTES = MAX_ESSAY_FILE_BYTES;
export const MAX_ESSAY_PDF_BYTES = MAX_ESSAY_FILE_BYTES;

export const SUPPORTED_ESSAY_SOURCE_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export function validateEssaySourceFile(file: File) {
  if (!SUPPORTED_ESSAY_SOURCE_TYPES.includes(file.type as never)) {
    return "Formato não suportado. Envie uma imagem JPG ou PNG, ou um arquivo PDF.";
  }

  const maximumSize = file.type === "application/pdf" ? MAX_ESSAY_PDF_BYTES : MAX_ESSAY_IMAGE_BYTES;

  if (file.size > maximumSize) {
    return "O arquivo deve ter no máximo 10 MB.";
  }

  return null;
}
