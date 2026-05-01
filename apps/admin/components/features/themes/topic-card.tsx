import { EssayTopic } from "@repo/types"
import { Button } from "@repo/ui/components/button"
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@repo/ui/components/menubar"
import { ThemeBadge } from "@repo/ui/components/theme-badge"
import { formatDate } from "@repo/utils"
import { Calendar, CheckCircle2, EllipsisVertical, Eye, OctagonAlert } from "lucide-react"


interface TopicCardProps {
  topic: EssayTopic
}

export default function TopicCard({ topic }: TopicCardProps) {
  return (
    <div
      key={topic.id}
      className="flex flex-col p-6 rounded-3xl border border-border bg-white shadow-sm min-h-fit justify-between gap-3"
    >
      <ThemeBadge
        value={topic.axis}
        className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-widest mb-12rounded-sm w-fit"
      />

      <h2 className="text-lg font-black leading-snug">
        {topic.title}
      </h2>

      <p className="text-slate-500 text-xs tracking-wider">
        {topic.source_type} | {topic.source_year}
      </p>

      <div className="flex items-center justify-between text-sm font-bold mt-2">
        <span className="flex items-center font-medium gap-1.5 text-slate-500">
          <Calendar className="size-3.5" />
          Cadastrado em {formatDate(topic.created_at, 'numeric')}
        </span>

        {topic.active === true ? (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            Ativo
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-500">
            <OctagonAlert className="size-3.5" />
            Inativo
          </span>
        )}
      </div>

      <div className="flex items-center w-full gap-2 mt-4">

        <Button
          variant="outline"
          className="flex-1 rounded-xl text-slate-500 font-bold h-10"
        >
          <Eye className="size-4 mr-2" /> Ver Proposta
        </Button>

        <Menubar className="shrink-0 w-fit border-none bg-transparent shadow-none p-0 m-0">
          <MenubarMenu>
            <MenubarTrigger asChild className="bg-transparent p-0 m-0 cursor-pointer">
              <Button variant='ghost' size="icon" className="h-10 w-10">
                <EllipsisVertical className="size-5" />
              </Button>
            </MenubarTrigger>

            <MenubarContent>
              <MenubarItem>
                Editar tema
              </MenubarItem>
              <MenubarItem>
                Desativar
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                Excluir tema
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div >
  )
}