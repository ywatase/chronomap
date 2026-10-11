import type { TextMap } from "../domain/manifest";

type Child = Node | string | null | undefined | false;

/** Minimal element factory: `h("button", { type: "button" }, "OK")`. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number | boolean | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === false) continue;
    if (name === "class") element.className = String(value);
    else element.setAttribute(name, value === true ? "" : String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child);
  }
  return element;
}

/** Japanese first, then the given default language, then any value. */
export function text(map: TextMap | undefined, fallbackLanguage = "en"): string {
  if (!map) return "";
  return map.ja ?? map[fallbackLanguage] ?? Object.values(map)[0] ?? "";
}
