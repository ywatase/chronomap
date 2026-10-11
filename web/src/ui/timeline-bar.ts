import type { Manifest } from "../domain/manifest";
import { createTimeline, nextRecordedYear, previousRecordedYear } from "../domain/timeline";
import { formatYear } from "../domain/year-filter";
import { h } from "./dom";

const STEPS = 1000;

/** Bottom bar: current year, non-linear slider with recorded-year ticks, and jumps. */
export function mountTimeline(root: HTMLElement, manifest: Manifest, initialYear: number, onChange: (year: number) => void) {
  const timeline = createTimeline(manifest.yearRange);
  let year = initialYear;

  const label = h("output", { class: "timeline-year", id: "timeline-year", "aria-live": "polite" });
  const slider = h("input", {
    type: "range",
    min: 0,
    max: STEPS,
    step: 1,
    id: "year-slider",
    "aria-label": "表示する年",
  });
  const input = h("input", { type: "number", class: "timeline-input", id: "year-input", "aria-label": "年を入力（紀元前は負の数）", min: manifest.yearRange.min, max: manifest.yearRange.max, step: 1 });
  const previous = h("button", { type: "button", class: "timeline-jump", id: "previous-year", "aria-label": "前の収録年へ" }, "◀");
  const next = h("button", { type: "button", class: "timeline-jump", id: "next-year", "aria-label": "次の収録年へ" }, "▶");
  const ticks = h("div", { class: "timeline-ticks", "aria-hidden": "true" });
  for (const recorded of manifest.years) {
    const tick = h("span", { class: "timeline-tick", title: formatYear(recorded) });
    tick.style.left = `${timeline.toPosition(recorded) * 100}%`;
    ticks.append(tick);
  }
  const track = h("div", { class: "timeline-track" }, ticks, slider);
  const range = h("div", { class: "timeline-range", "aria-hidden": "true" }, h("span", {}, formatYear(manifest.yearRange.min)), h("span", {}, formatYear(manifest.yearRange.max)));
  root.append(h("div", { class: "timeline-head" }, previous, label, next, input), track, range);

  function render() {
    label.textContent = formatYear(year);
    slider.value = String(Math.round(timeline.toPosition(year) * STEPS));
    slider.setAttribute("aria-valuetext", formatYear(year));
    input.value = String(year);
    previous.disabled = previousRecordedYear(manifest.years, year) === null;
    next.disabled = nextRecordedYear(manifest.years, year) === null;
  }

  function set(value: number, notify = true) {
    const clamped = Math.min(manifest.yearRange.max, Math.max(manifest.yearRange.min, Math.round(value)));
    if (clamped === year && notify) return render();
    year = clamped;
    render();
    if (notify) onChange(year);
  }

  slider.addEventListener("input", () => set(timeline.toYear(Number(slider.value) / STEPS)));
  slider.addEventListener("keydown", (event) => {
    const jumps: Record<string, () => number | null> = {
      ArrowLeft: () => year - 1,
      ArrowDown: () => year - 1,
      ArrowRight: () => year + 1,
      ArrowUp: () => year + 1,
      PageDown: () => previousRecordedYear(manifest.years, year),
      PageUp: () => nextRecordedYear(manifest.years, year),
      Home: () => manifest.yearRange.min,
      End: () => manifest.yearRange.max,
    };
    const target = jumps[event.key]?.();
    if (jumps[event.key]) event.preventDefault();
    if (target !== undefined && target !== null) set(target);
  });
  input.addEventListener("change", () => {
    const value = Number(input.value);
    if (Number.isFinite(value)) set(value);
    else render();
  });
  previous.addEventListener("click", () => {
    const target = previousRecordedYear(manifest.years, year);
    if (target !== null) set(target);
  });
  next.addEventListener("click", () => {
    const target = nextRecordedYear(manifest.years, year);
    if (target !== null) set(target);
  });
  render();
  return { setYear: (value: number) => set(value, false) };
}
