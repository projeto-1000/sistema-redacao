import "server-only";

const AZURE_API_VERSION = "2024-11-30";
const MODEL_ID = "prebuilt-layout";

export interface LowConfidenceWord {
  text: string;
  confidence: number;
}

export interface EssayTranscription {
  text: string;
  lowConfidenceWords: LowConfidenceWord[];
}

interface AzureSpan {
  offset: number;
  length: number;
}

interface AzureWord {
  content: string;
  confidence?: number;
  polygon?: number[];
  span?: AzureSpan;
}

interface AzureLine {
  content: string;
  polygon?: number[];
  spans?: AzureSpan[];
}

interface AzurePage {
  pageNumber: number;
  width: number;
  height: number;
  words?: AzureWord[];
  lines?: AzureLine[];
}

interface AzureStyle {
  confidence?: number;
  spans?: AzureSpan[];
  isHandwritten?: boolean;
}

interface AzureAnalyzeResult {
  status: "notStarted" | "running" | "succeeded" | "failed";
  error?: {
    code?: string;
    message?: string;
  };
  analyzeResult?: {
    pages?: AzurePage[];
    styles?: AzureStyle[];
  };
}

function getEnvironment() {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !key) {
    throw new Error("Azure Document Intelligence environment variables are missing.");
  }

  return {
    endpoint: endpoint.replace(/\/$/, ""),
    key,
  };
}

function spansOverlap(a: AzureSpan, b: AzureSpan) {
  const aEnd = a.offset + a.length;
  const bEnd = b.offset + b.length;

  return a.offset < bEnd && b.offset < aEnd;
}

function isSpanHandwritten(span: AzureSpan, handwrittenSpans: AzureSpan[]) {
  return handwrittenSpans.some((handwrittenSpan) => spansOverlap(span, handwrittenSpan));
}

function getLineTopY(line: AzureLine) {
  if (!line.polygon?.length) {
    return 0;
  }

  const ys = line.polygon.filter((_, index) => index % 2 !== 0);

  return Math.min(...ys);
}

function getLineLeftX(line: AzureLine) {
  if (!line.polygon?.length) {
    return 0;
  }

  const xs = line.polygon.filter((_, index) => index % 2 === 0);

  return Math.min(...xs);
}

function getLineHeight(line: AzureLine) {
  if (!line.polygon?.length) {
    return 0;
  }

  const ys = line.polygon.filter((_, index) => index % 2 !== 0);

  return Math.max(...ys) - Math.min(...ys);
}

function findLargestContinuousBlock(lines: AzureLine[]) {
  if (lines.length <= 1) {
    return lines;
  }

  const sortedLines = [...lines].sort((a, b) => getLineTopY(a) - getLineTopY(b));

  const firstLine = sortedLines[0];

  if (!firstLine) {
    return [];
  }

  const blocks: AzureLine[][] = [];
  let currentBlock: AzureLine[] = [firstLine];

  for (let index = 1; index < sortedLines.length; index++) {
    const previousLine = sortedLines[index - 1];
    const currentLine = sortedLines[index];

    if (!previousLine || !currentLine) {
      continue;
    }

    const previousTop = getLineTopY(previousLine);
    const currentTop = getLineTopY(currentLine);

    const previousHeight = getLineHeight(previousLine);
    const currentHeight = getLineHeight(currentLine);

    const averageHeight = (previousHeight + currentHeight) / 2 || 1;

    const verticalGap = currentTop - previousTop;

    const isContinuous = verticalGap <= averageHeight * 2.5;

    if (isContinuous) {
      currentBlock.push(currentLine);
    } else {
      blocks.push(currentBlock);
      currentBlock = [currentLine];
    }
  }

  blocks.push(currentBlock);

  return blocks.reduce<AzureLine[]>(
    (largest, block) => (block.length > largest.length ? block : largest),
    []
  );
}

function buildPageText(lines: AzureLine[], pageWidth: number) {
  if (lines.length === 0) {
    return "";
  }

  const cleanedLines = lines
    .map((line) => ({
      ...line,
      content: line.content.trim(),
    }))
    .filter((line) => line.content);

  if (cleanedLines.length === 0) {
    return "";
  }

  const leftPositions = cleanedLines.map(getLineLeftX).sort((a, b) => a - b);

  const baselineLeft = leftPositions[Math.floor(leftPositions.length / 2)] ?? 0;

  const paragraphIndentThreshold = pageWidth * 0.03;

  let text = "";

  cleanedLines.forEach((line, index) => {
    const content = line.content;
    const leftX = getLineLeftX(line);

    const isFirstLine = index === 0;

    const isParagraphStart = !isFirstLine && leftX > baselineLeft + paragraphIndentThreshold;

    if (isFirstLine) {
      text = content;
      return;
    }

    if (isParagraphStart) {
      text += `\n\n${content}`;
      return;
    }

    if (text.endsWith("-")) {
      text = text.slice(0, -1) + content;
      return;
    }

    text += ` ${content}`;
  });

  return text;
}

function extractEssay(result: AzureAnalyzeResult): EssayTranscription {
  const pages = result.analyzeResult?.pages ?? [];
  const styles = result.analyzeResult?.styles ?? [];

  const handwrittenSpans = styles
    .filter((style) => style.isHandwritten)
    .flatMap((style) => style.spans ?? []);

  const pageTexts: string[] = [];
  const lowConfidenceWords: LowConfidenceWord[] = [];

  for (const page of pages) {
    const handwrittenLines =
      page.lines?.filter((line) =>
        (line.spans ?? []).some((span) => isSpanHandwritten(span, handwrittenSpans))
      ) ?? [];

    const essayLines = findLargestContinuousBlock(handwrittenLines);

    const pageText = buildPageText(essayLines, page.width);

    if (pageText) {
      pageTexts.push(pageText);
    }

    for (const word of page.words ?? []) {
      if (word.confidence === undefined || !word.span || word.confidence >= 0.7) {
        continue;
      }

      if (isSpanHandwritten(word.span, handwrittenSpans)) {
        lowConfidenceWords.push({
          text: word.content,
          confidence: word.confidence,
        });
      }
    }
  }

  return {
    text: pageTexts.join("\n\n"),
    lowConfidenceWords,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForResult(operationLocation: string, key: string): Promise<AzureAnalyzeResult> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(operationLocation, {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
      },
      cache: "no-store",
    });

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");

      const retryAfterSeconds = Number(retryAfterHeader ?? "5");

      const waitTime =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : 5000;

      await sleep(waitTime);

      continue;
    }

    if (!response.ok) {
      const errorBody = await response.text();

      throw new Error(`Failed to retrieve Azure OCR result: ${response.status} ${errorBody}`);
    }

    const result = (await response.json()) as AzureAnalyzeResult;

    if (result.status === "succeeded") {
      return result;
    }

    if (result.status === "failed") {
      throw new Error(result.error?.message ?? "Azure Document Intelligence analysis failed.");
    }

    await sleep(2000);
  }

  throw new Error("Azure Document Intelligence analysis timed out.");
}

async function startAnalysis(
  endpoint: string,
  key: string,
  file: ArrayBuffer,
  contentType: string
) {
  const url =
    `${endpoint}/documentintelligence/documentModels/${MODEL_ID}:analyze` +
    `?api-version=${AZURE_API_VERSION}` +
    `&locale=pt` +
    `&features=ocr.highResolution`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": contentType,
      },
      body: file,
    });

    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");

      const retryAfterSeconds = Number(retryAfterHeader ?? "5");

      const waitTime =
        Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : 5000;

      await sleep(waitTime);

      continue;
    }

    if (!response.ok) {
      const error = await response.text();

      throw new Error(`Azure Document Intelligence request failed: ${response.status} ${error}`);
    }

    return response;
  }

  throw new Error("Azure Document Intelligence rate limit exceeded after multiple retries.");
}

export async function transcribeEssay(
  file: ArrayBuffer,
  contentType: string
): Promise<EssayTranscription> {
  const { endpoint, key } = getEnvironment();

  const response = await startAnalysis(endpoint, key, file, contentType);

  const operationLocation = response.headers.get("operation-location");

  if (!operationLocation) {
    throw new Error("Azure Document Intelligence did not return an operation location.");
  }

  const result = await waitForResult(operationLocation, key);

  return extractEssay(result);
}
