import { EssaysFilter } from "@/types";
import { TopicsFilter } from "@repo/types";

export type NextSearchParams = { [key: string]: string | string[] | undefined };

export function parseEssaysFilters(params: NextSearchParams = {}): EssaysFilter {
  const allowedKeys: (keyof EssaysFilter)[] = [
    "search",
    "status",
    "thematicAxis",
    "totalScore",
    "from",
    "to",
  ];

  return allowedKeys.reduce((acc, key) => {
    const value = params[key];

    if (typeof value === "string") {
      acc[key] = value;
    }

    return acc;
  }, {} as EssaysFilter);
}

export function parseTopicsFilters(params: NextSearchParams = {}): TopicsFilter {
  const allowedKeys: (keyof TopicsFilter)[] = ["search", "axis"];

  return allowedKeys.reduce((acc, key) => {
    const value = params[key];

    if (typeof value === "string") {
      // @ts-expect-error - Garantimos a tipagem na saída
      acc[key] = value;
    }

    return acc;
  }, {} as TopicsFilter);
}
