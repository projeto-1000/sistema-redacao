"use client";

import type { EssayTopicDetail, MotivationalText } from "@repo/types";

function MotivatingTextItem({ item }: { item: MotivationalText }) {
  return (
    <div className="mb-6 text-left last:mb-0">
      <span className="mb-2 inline-block rounded-md bg-[#EBC84C]/20 px-2 py-1 text-[10px] font-bold tracking-widest text-[#8B781F] uppercase">
        Texto {item.text_number}
      </span>

      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-left text-sm leading-relaxed text-slate-600">
        {item.body_text && (
          <p className="whitespace-pre-line transition-all hover:line-clamp-none">
            {item.body_text}
          </p>
        )}

        {item.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={`Texto motivador ${item.text_number}`}
            className="mt-2 h-auto w-full rounded-md"
          />
        )}

        {item.source_reference && (
          <div className="mt-2 border-t border-slate-200 pt-2">
            <p className="text-[10px] text-slate-400 italic">Fonte: {item.source_reference}</p>
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
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Tema Selecionado
        </span>
        <h2 className="mt-1 text-left text-lg leading-tight font-bold">{topic.title}</h2>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase">
            {topic.source_type} {topic.source_year}
          </span>
          <span className="rounded-sm bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 uppercase">
            {topic.axis}
          </span>
        </div>
      </div>

      <div className="mb-8 rounded-r-xl border-l-4 border-[#EBC84C] bg-[#FFFDF5] p-4 text-left text-sm">
        <h5 className="mb-2 text-[10px] font-bold tracking-widest text-[#8B781F] uppercase">
          Comando da Proposta
        </h5>
        <p className="text-xs leading-relaxed text-slate-700 md:text-sm">
          A partir da leitura dos textos motivadores e com base nos conhecimentos construídos ao
          longo de sua formação, redija texto dissertativo-argumentativo em modalidade escrita
          formal da língua portuguesa sobre o tema:
          <span className="font-bold text-[#1E3A8A]">“{topic.title}”</span>.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          Textos Motivadores
        </span>
        <div className="h-px flex-1 bg-slate-100"></div>
      </div>

      <div>
        {texts.map((text) => (
          <MotivatingTextItem key={text.id} item={text} />
        ))}
      </div>
    </div>
  );
}
