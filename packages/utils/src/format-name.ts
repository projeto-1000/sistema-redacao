export function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] || "";
}