"use client";

import type { EssayTopicDetail, MotivationalText } from "@repo/types";

function MotivatingTextItem({ item }: { item: MotivationalText }) {
  return (
    <div className="mb-6 last:mb-0 text-left">
      <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#8B781F] bg-[#EBC84C]/20 rounded-md">
        Texto {item.text_number}
      </span>

      <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 text-left">
        {item.body_text && (
          <p className="whitespace-pre-line hover:line-clamp-none transition-all">
            {item.body_text}
          </p>
        )}

        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={`Texto motivador ${item.text_number}`}
            className="w-full h-auto mt-2 rounded-md"
          />
        )}

        {item.source_reference && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <p className="text-[10px] text-slate-400 italic">
              Fonte: {item.source_reference}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function MotivationalTexts({ topic }: { topic: EssayTopicDetail }) {
  const texts = topic.motivational_texts
    ? [...topic.motivational_texts].sort((a, b) => a.text_number - b.text_number)
    : [];

  return (
    <div className="py-4 lg:p-5">

      <div className="mb-6 flex flex-col items-start">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
          Tema Selecionado
        </span>
        <h2 className="text-lg font-bold leading-tight text-left mt-1">
          {topic.title}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-sm font-semibold uppercase">
            {topic.source_type} {topic.source_year}
          </span>
          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-sm font-semibold uppercase">
            {topic.axis}
          </span>
        </div>
      </div>

      <div className="mb-8 p-4 bg-[#FFFDF5] border-l-4 border-[#EBC84C] rounded-r-xl text-sm text-left">
        <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#8B781F] mb-2">
          Comando da Proposta
        </h5>
        <p className="text-slate-700 leading-relaxed text-xs md:text-sm">
          A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao longo de sua formação, redija texto dissertativo-argumentativo em modalidade escrita formal da língua portuguesa sobre o tema:
          <span className="font-bold text-[#1E3A8A]">“{topic.title}”</span>.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">
          Textos Motivadores
        </span>
        <div className="h-px bg-slate-100 flex-1"></div>
      </div>

      <div>
        {texts.map((text) => (
          <MotivatingTextItem key={text.id} item={text} />
        ))}
      </div>
    </div>
  );
}