import { EssaysFilter } from "@/types";

export type NextSearchParams = { [key: string]: string | string[] | undefined };

export function parseFilters(params: NextSearchParams = {}): EssaysFilter {
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
