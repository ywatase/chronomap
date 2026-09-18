import * as QRCode from "qrcode";
import { normalizeLessonPackAccessUrl } from "../domain/lesson-pack-access";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const QUIET_ZONE = 4;
const FIXED_SIZE = 192;
const DEFAULT_ARIA_LABEL = "ガイド教材を開くQRコード";

export interface LessonPackQrOptions {
  readonly ariaLabel?: string;
}

/**
 * Render a local, print-friendly QR code. Invalid URLs and encoder failures
 * leave the host empty so callers can keep a plain-text fallback.
 */
export function renderLessonPackQr(container: HTMLElement, payload: unknown, options: LessonPackQrOptions = {}): boolean {
  container.replaceChildren();
  const safePayload = normalizeLessonPackAccessUrl(payload).qrPayload;
  if (!safePayload) return false;
  try {
    const code = QRCode.create(safePayload, { errorCorrectionLevel: "M" });
    const modules = code.modules;
    if (!modules || !Number.isInteger(modules.size) || modules.size <= 0) return false;
    const dimension = modules.size + QUIET_ZONE * 2;
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.setAttribute("xmlns", SVG_NAMESPACE);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.ariaLabel?.trim() || DEFAULT_ARIA_LABEL);
    svg.setAttribute("width", String(FIXED_SIZE));
    svg.setAttribute("height", String(FIXED_SIZE));
    svg.setAttribute("viewBox", `0 0 ${dimension} ${dimension}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("data-quiet-zone", String(QUIET_ZONE));
    svg.dataset.lessonPackQr = "";

    const background = document.createElementNS(SVG_NAMESPACE, "rect");
    background.setAttribute("width", String(dimension));
    background.setAttribute("height", String(dimension));
    background.setAttribute("fill", "#fff");
    const modulesPath = document.createElementNS(SVG_NAMESPACE, "path");
    modulesPath.setAttribute("fill", "#000");
    const path = [];
    for (let row = 0; row < modules.size; row += 1) {
      for (let column = 0; column < modules.size; column += 1) {
        if (modules.get(row, column)) path.push(`M${column + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
      }
    }
    if (!path.length) return false;
    modulesPath.setAttribute("d", path.join(""));
    svg.append(background, modulesPath);
    container.append(svg);
    return true;
  } catch {
    container.replaceChildren();
    return false;
  }
}
