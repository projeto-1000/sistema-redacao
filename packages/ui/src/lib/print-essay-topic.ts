import type { EssayTopicDetail } from "@repo/types";

const PRINT_STYLES = `
  @page {
    size: A4;
    margin: 16mm;
    @bottom-left { content: "Projeto 1000"; font: 8pt Arial, sans-serif; color: #626870; }
    @bottom-right { content: counter(page) " / " counter(pages); font: 8pt Arial, sans-serif; color: #626870; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: white; color: #20242b; font: 10.5pt/1.5 Arial, sans-serif; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 8mm; border-bottom: .2mm solid #d7dbe0; padding-bottom: 5mm; margin-bottom: 7mm; break-inside: avoid; }
  header img { width: 32mm; height: 14mm; object-fit: contain; }
  .metadata { text-align: right; color: #626870; font-size: 9pt; }
  .metadata p { margin: 0; }
  h1 { font-size: 20pt; line-height: 1.25; margin: 0 0 4mm; break-after: avoid; }
  .axis { color: #626870; font-size: 9pt; margin: 0 0 8mm; break-after: avoid; }
  h2 { font-size: 10pt; margin: 6mm 0 3mm; break-after: avoid; }
  h3 { font-size: 9pt; color: #1e3a8a; margin: 6mm 0 3mm; break-after: avoid; }
  p { margin: 0 0 3mm; orphans: 3; widows: 3; }
  .body-text { white-space: pre-wrap; overflow-wrap: anywhere; }
  .command { margin-bottom: 7mm; }
  .texts-heading { border-top: .2mm solid #d7dbe0; padding-top: 5mm; }
  section { margin-bottom: 6mm; }
  .motivating-image { display: block; max-width: 100%; max-height: 205mm; width: auto; height: auto; object-fit: contain; margin: 4mm auto; break-inside: avoid; }
  .source { font-size: 8pt; color: #626870; overflow-wrap: anywhere; break-inside: avoid; }
  .instructions { border-top: .2mm solid #d7dbe0; padding-top: 1mm; margin-top: 7mm; break-inside: avoid; }
  ul { padding-left: 5mm; margin: 0; }
`;

function addText<K extends keyof HTMLElementTagNameMap>(
  document: Document,
  parent: HTMLElement,
  tag: K,
  value: string,
  className?: string
) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  parent.append(element);
  return element;
}

function waitForImage(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = () => {
      clearTimeout(timeout);
      image.removeEventListener("load", loaded);
      image.removeEventListener("error", failed);
    };
    const loaded = () => {
      finish();
      if (image.naturalWidth > 0) resolve();
      else reject(new Error("Não foi possível carregar uma imagem da proposta."));
    };
    const failed = () => {
      finish();
      reject(new Error("Não foi possível carregar uma imagem da proposta. Tente novamente."));
    };
    const timeout = setTimeout(failed, 20_000);
    image.addEventListener("load", loaded);
    image.addEventListener("error", failed);
    if (image.complete) loaded();
  });
}

/** Print only the proposal in an isolated document, without changing the editor. */
export async function printEssayTopic(
  topic: EssayTopicDetail,
  signal?: AbortSignal
): Promise<() => void> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.title = "Impressão da proposta de redação";
  frame.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;";
  const cleanup = () => {
    frame.remove();
    signal?.removeEventListener("abort", cleanup);
  };
  signal?.throwIfAborted();
  signal?.addEventListener("abort", cleanup, { once: true });

  try {
    await new Promise<void>((resolve, reject) => {
      const aborted = () => reject(new Error("Impressão cancelada."));
      signal?.addEventListener("abort", aborted, { once: true });
      frame.onload = () => {
        signal?.removeEventListener("abort", aborted);
        resolve();
      };
      frame.onerror = () => {
        signal?.removeEventListener("abort", aborted);
        reject(new Error("Não foi possível preparar a impressão."));
      };
      frame.src = "about:blank";
      document.body.append(frame);
    });

    const printDocument = frame.contentDocument;
    const printWindow = frame.contentWindow;
    if (!printDocument || !printWindow) throw new Error("Não foi possível preparar a impressão.");

    printDocument.documentElement.lang = "pt-BR";
    printDocument.title = `Proposta de redação - ${topic.title}`;
    const style = printDocument.createElement("style");
    style.textContent = PRINT_STYLES;
    printDocument.head.append(style);

    const body = printDocument.body;
    const header = printDocument.createElement("header");
    body.append(header);
    const logo = printDocument.createElement("img");
    logo.src = new URL("/logo.svg", window.location.href).href;
    logo.alt = "Projeto 1000";
    header.append(logo);
    const metadata = printDocument.createElement("div");
    metadata.className = "metadata";
    header.append(metadata);
    addText(printDocument, metadata, "p", "PROPOSTA DE REDAÇÃO");
    addText(
      printDocument,
      metadata,
      "p",
      [topic.source_type, topic.source_year].filter(Boolean).join(" · ")
    );

    addText(printDocument, body, "h1", topic.title);
    addText(
      printDocument,
      body,
      "p",
      `EIXO TEMÁTICO: ${topic.axis.toLocaleUpperCase("pt-BR")}`,
      "axis"
    );
    addText(printDocument, body, "h2", "COMANDO DA PROPOSTA");
    addText(
      printDocument,
      body,
      "p",
      `A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema “${topic.title}”.`,
      "command"
    );
    addText(printDocument, body, "h2", "TEXTOS MOTIVADORES", "texts-heading");

    for (const text of [...topic.motivational_texts].sort(
      (a, b) => a.text_number - b.text_number
    )) {
      const section = printDocument.createElement("section");
      body.append(section);
      addText(printDocument, section, "h3", `TEXTO ${text.text_number}`);
      if (text.body_text) addText(printDocument, section, "p", text.body_text, "body-text");
      if (text.image_url) {
        const image = printDocument.createElement("img");
        image.className = "motivating-image";
        image.alt = `Texto motivador ${text.text_number}`;
        image.src = text.image_url;
        section.append(image);
      }
      if (text.source_reference)
        addText(printDocument, section, "p", `Fonte: ${text.source_reference}`, "source");
    }

    const instructions = printDocument.createElement("section");
    instructions.className = "instructions";
    body.append(instructions);
    addText(printDocument, instructions, "h2", "INSTRUÇÕES");
    const list = printDocument.createElement("ul");
    instructions.append(list);
    for (const instruction of [
      "Seu texto deve ter no mínimo 7 e no máximo 30 linhas.",
      "Cópias dos textos motivadores não são contabilizadas.",
      "Apresente uma proposta de intervenção.",
    ])
      addText(printDocument, list, "li", instruction);

    await Promise.all(Array.from(printDocument.images, waitForImage));
    await printDocument.fonts.ready;
    signal?.throwIfAborted();
    printWindow.addEventListener("afterprint", cleanup, { once: true });
    printWindow.print();
    return cleanup;
  } catch (error) {
    cleanup();
    throw error;
  }
}
