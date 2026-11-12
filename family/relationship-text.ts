import { relationshipLabels } from "@/elderly/relationship-labels";
import type { FamilyMock, SidebarElderlyLink } from "./types";

const DEFAULT_RELATIONSHIP = "Familiar";

function joinNames(names: string[]): string {
  const [first, second, ...rest] = names;
  if (!second) return first;
  if (rest.length > 0) return `${first}, ${second} y ${rest.length} más`;
  return `${first} y ${second}`;
}

// Parentesco común de todos los vínculos; si difieren, uno genérico
function resolveRelationshipLabel(links: SidebarElderlyLink[]): string {
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

export function buildProfileRelationship({
  relationshipLabel,
  elderly,
}: Pick<FamilyMock, "relationshipLabel" | "elderly">): string {
  return `${relationshipLabel} de ${elderly.map(({ fullName }) => fullName).join(" y ")}`;
}
