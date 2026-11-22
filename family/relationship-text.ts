import { relationshipLabels } from "@/elderly/relationship-labels";
import type { RelationshipType } from "@/shared/database/types";
import type { SidebarElderlyLink } from "./types";

const DEFAULT_RELATIONSHIP = "Familiar";

type RelationshipLink = { relationship: RelationshipType };

function joinNames(names: string[]): string {
  const [first, second, ...rest] = names;
  if (!second) return first;
  if (rest.length > 0) return `${first}, ${second} y ${rest.length} más`;
  return `${first} y ${second}`;
}

// "A", "A y B", "A, B y C"
function joinAllNames(names: string[]): string {
  const last = names.at(-1);
  if (names.length < 2 || !last) return names[0];
  return `${names.slice(0, -1).join(", ")} y ${last}`;
}

// Parentesco común de todos los vínculos; si difieren, uno genérico
function resolveRelationshipLabel(links: RelationshipLink[]): string {
  const [first] = links;
  const allEqual = links.every(
    ({ relationship }) => relationship === first.relationship,
  );
  return allEqual
    ? relationshipLabels[first.relationship].label
    : DEFAULT_RELATIONSHIP;
}

// Los vínculos llegan ordenados (el primero vinculado va primero)
export function buildSidebarRelationship(links: SidebarElderlyLink[]): string {
  if (links.length === 0) return DEFAULT_RELATIONSHIP;

  const names = links.map(({ firstName }) => firstName);
  return `${resolveRelationshipLabel(links)} de ${joinNames(names)}`;
}

// Los vínculos llegan ordenados y solo con adultos mayores activos
export function buildProfileRelationship(
  links: (RelationshipLink & { fullName: string })[],
): string {
  if (links.length === 0) return DEFAULT_RELATIONSHIP;

  const names = links.map(({ fullName }) => fullName);
  return `${resolveRelationshipLabel(links)} de ${joinAllNames(names)}`;
}
