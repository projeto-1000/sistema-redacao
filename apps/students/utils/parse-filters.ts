import { EssaysFilter } from "@/types";
import { CreditsFilters, TopicsFilter } from "@repo/types";

export type NextSearchParams = { [key: string]: string | string[] | undefined };

function getSearchParamValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export function parseEssaysFilters(params: NextSearchParams = {}): EssaysFilter {
  return {
    search: getSearchParamValue(params.search),
    status: getSearchParamValue(params.status) as EssaysFilter["status"],
    thematicAxis: getSearchParamValue(params.thematicAxis) as EssaysFilter["thematicAxis"],
    totalScore: getSearchParamValue(params.totalScore),
    from: getSearchParamValue(params.from),
    to: getSearchParamValue(params.to),
  };
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

export function parseCreditsTransactionsFilters(params: NextSearchParams = {}): CreditsFilters {
  const allowedKeys: (keyof CreditsFilters)[] = ["type", "from", "to"];

  return allowedKeys.reduce((acc, key) => {
    const value = params[key];

    if (typeof value === "string") {
      // @ts-expect-error - Garantimos a tipagem na saída
      acc[key] = value;
    }

    return acc;
  }, {} as CreditsFilters);
}
