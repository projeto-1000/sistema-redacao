import { PendingEssaysFilter } from "@/types";

export type NextSearchParams = { [key: string]: string | string[] | undefined };

export function parsePendingEssaysFilters(params: NextSearchParams = {}): PendingEssaysFilter {
  const allowedKeys: (keyof PendingEssaysFilter)[] = ["search", "from", "to"];

  return allowedKeys.reduce((acc, key) => {
    const value = params[key];

    if (typeof value === "string") {
      acc[key] = value;
    }

    return acc;
  }, {} as PendingEssaysFilter);
}
