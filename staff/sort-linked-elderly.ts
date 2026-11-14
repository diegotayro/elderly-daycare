import type { LinkedElderly } from "./types";

// Activos primero. Array.sort es estable: dentro de cada grupo se conserva el
// orden de entrada, que es la fecha de vínculo.
export function sortLinkedElderly(linked: LinkedElderly[]): LinkedElderly[] {
  return [...linked].sort(
    (a, b) => Number(a.status === "archived") - Number(b.status === "archived"),
  );
}
