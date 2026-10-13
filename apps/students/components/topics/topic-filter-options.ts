import {
  BriefcaseMedical,
  Cpu,
  GraduationCap,
  Leaf,
  Palette,
  Scale,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ElementType } from "react";

import type { ThematicAxis } from "@repo/types";

export const AXIS_FILTERS: ("Todos" | ThematicAxis)[] = [
  "Todos",
  "Meio Ambiente",
  "Questões Sociais",
  "Saúde",
  "Cultura",
  "Direitos e Cidadania",
  "Educação",
  "Tecnologia",
  "Economia",
];

export const AXIS_ICONS: Record<ThematicAxis, ElementType> = {
  "Meio Ambiente": Leaf,
  "Questões Sociais": Users,
  Saúde: BriefcaseMedical,
  Cultura: Palette,
  "Direitos e Cidadania": Scale,
  Educação: GraduationCap,
  Tecnologia: Cpu,
  Economia: TrendingUp,
};
