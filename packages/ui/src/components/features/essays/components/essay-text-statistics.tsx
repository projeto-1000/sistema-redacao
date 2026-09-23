import { countCharacters, countWords } from "@repo/ui/lib/utils";
import { Hash, Text } from "lucide-react";

interface EssayTextStatisticsProps {
  text: string;
}

const numberFormatter = new Intl.NumberFormat("pt-BR");

export function EssayTextStatistics({ text }: EssayTextStatisticsProps) {
  const wordCount = countWords(text);
  const characterCount = countCharacters(text);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3 md:px-8">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Estatísticas do texto
      </span>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Text className="size-3.5 text-indigo-500" />
          <strong className="font-black text-slate-800">
            {numberFormatter.format(wordCount)}
          </strong>
          {wordCount === 1 ? "palavra" : "palavras"}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <Hash className="size-3.5 text-indigo-500" />
          <strong className="font-black text-slate-800">
            {numberFormatter.format(characterCount)}
          </strong>
          {characterCount === 1 ? "caractere" : "caracteres"}
        </span>
      </div>
    </div>
  );
}
