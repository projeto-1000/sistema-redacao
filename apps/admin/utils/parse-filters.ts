import { PendingEssaysFilter, GradedEssaysFilter, StudentsFilter } from "@repo/types";

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

export function parseGradedEssaysFilters(params: NextSearchParams = {}): GradedEssaysFilter {
  const allowedKeys: (keyof GradedEssaysFilter)[] = ["search", "from", "to"];

  return allowedKeys.reduce((acc, key) => {
    const value = params[key];

    if (typeof value === "string") {
      acc[key] = value;
    }

    return acc;
  }, {} as GradedEssaysFilter);
}

export function parseStudentsFilters(params: NextSearchParams = {}): StudentsFilter {
  const allowedKeys: (keyof StudentsFilter)[] = ["search", "status", "from", "to"];

  return allowedKeys.reduce((acc, key) => {
    const value = params[key];

    if (typeof value === "string") {
      acc[key] = value;
    }

    return acc;
  }, {} as StudentsFilter);
}
