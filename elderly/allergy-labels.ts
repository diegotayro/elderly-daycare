export const allergyLabels: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
};

export function getAllergyLabel(tag: string): string {
  return allergyLabels[tag] ?? tag.toUpperCase();
}
