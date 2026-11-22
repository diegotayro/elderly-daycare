import { isUuid } from "@/shared/text/is-uuid";

const ELDERLY_LIST_HREF = "/elderly";

// `from` es el adulto mayor desde donde se entró; sin un id válido, vuelve a la lista
export function buildBackHref(from: string | string[] | undefined): string {
  return typeof from === "string" && isUuid(from)
    ? `${ELDERLY_LIST_HREF}/${from}`
    : ELDERLY_LIST_HREF;
}
