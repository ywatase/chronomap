import type { Assessment, ResolvedDetail, TemporalBoundary } from "../domain/details";
import type { DatasetEntry } from "../domain/manifest";
import { formatYear } from "../domain/year-filter";
import type { PickedFeature } from "../map/map-view";
import { h, text } from "./dom";

const ASSESSMENT_LABELS: Record<string, string> = {
  "well-supported": "根拠あり",
  approximate: "概略",
  disputed: "諸説あり",
  unknown: "不明",
  "not-applicable": "該当なし",
};
const DIMENSION_LABELS = { temporal: "時期", location: "位置", geometry: "形状", identity: "同一性" } as const;

export function formatPeriod(start: TemporalBoundary | null, end: TemporalBoundary | null): string {
  const from = start?.earliestYear ?? null;
  const to = end?.latestYear ?? null;
  const circa = start?.qualifier === "circa" || end?.qualifier === "circa" ? "頃" : "";
  if (from !== null && to !== null && from === to) return `${formatYear(from)}${circa}`;
  return `${from === null ? "開始不明" : formatYear(from)} 〜 ${to === null ? "終了不明" : formatYear(to)}${circa}`;
}

function assessmentRow(dimension: keyof typeof DIMENSION_LABELS, value: Assessment) {
  return h(
    "div",
    { class: "assessment" },
    h("dt", {}, DIMENSION_LABELS[dimension]),
    h("dd", {}, h("span", { class: `badge badge-${value.assessment}` }, ASSESSMENT_LABELS[value.assessment] ?? value.assessment), value.note ? ` ${value.note}` : ""),
  );
}

/** Right-side panel (bottom sheet on phones) with the selected feature's evidence. */
export function mountDetailPanel(root: HTMLElement, datasets: readonly DatasetEntry[], handlers: { onClose: () => void; onChoose: (feature: PickedFeature) => void }) {
  // Features under the click, top-most first; the first opens and the rest are listed below it.
  const body = h("div", { class: "detail-body", id: "detail-body" });
  const close = h("button", { type: "button", class: "detail-close", "aria-label": "詳細を閉じる" }, "×");
  close.addEventListener("click", () => handlers.onClose());
  root.append(close, body);
  root.hidden = true;
  const datasetBySlug = new Map(datasets.map((dataset) => [dataset.slug, dataset]));

  function choiceList(features: readonly PickedFeature[]) {
    const list = h("ul", { class: "choice-list", id: "other-features" });
    for (const feature of features) {
      const button = h("button", { type: "button", class: "choice" }, feature.name, h("small", {}, text(datasetBySlug.get(feature.dataset)?.title)));
      button.addEventListener("click", () => handlers.onChoose(feature));
      list.append(h("li", {}, button));
    }
    return list;
  }

  function show(...children: (Node | null)[]) {
    body.replaceChildren(...children.filter((child): child is Node => child !== null));
    root.hidden = false;
  }

  return {
    hide() {
      root.hidden = true;
      body.replaceChildren();
    },
    loading(name: string) {
      show(h("h2", { class: "detail-title" }, name), h("p", { role: "status" }, "詳細を読み込んでいます…"));
    },
    failed(name: string) {
      show(h("h2", { class: "detail-title" }, name), h("p", { role: "alert" }, "詳細を読み込めませんでした。時間をおいてもう一度選んでください。"));
    },
    detail(resolved: ResolvedDetail, others: readonly PickedFeature[] = []) {
      const dataset = datasetBySlug.get(resolved.dataset);
      const language = dataset?.defaultLanguage ?? "en";
      const { feature } = resolved;
      const uncertainty = h("dl", { class: "assessments" }, ...(Object.keys(DIMENSION_LABELS) as (keyof typeof DIMENSION_LABELS)[]).map((key) => assessmentRow(key, feature.uncertainty[key])));
      const evidence = h(
        "ol",
        { class: "evidence-list" },
        ...resolved.evidence.map((item) =>
          h(
            "li",
            {},
            h("p", { class: "evidence-source" }, item.source?.url ? h("a", { href: item.source.url, target: "_blank", rel: "noreferrer" }, item.source.citation) : item.source?.citation ?? item.sourceId),
            item.locator ? h("p", { class: "evidence-locator" }, `箇所: ${item.locator}`) : null,
            item.note ? h("p", { class: "evidence-note" }, item.note) : null,
            item.source?.rights?.attribution ? h("p", { class: "evidence-rights" }, `権利: ${item.source.rights.attribution}${item.source.rights.terms ? `（${item.source.rights.terms}）` : ""}`) : null,
          ),
        ),
      );
      show(
        h("p", { class: "detail-dataset" }, text(dataset?.title, language)),
        h("h2", { class: "detail-title", id: "detail-title" }, text(feature.labels, language)),
        feature.hypothesisLabel ? h("p", { class: "detail-hypothesis" }, `仮説: ${text(feature.hypothesisLabel, language)}`) : null,
        h("p", { class: "detail-period" }, h("strong", {}, "可能期間 "), formatPeriod(feature.temporal.start, feature.temporal.end)),
        h("p", { class: "detail-description" }, text(feature.description, language)),
        h("h3", {}, "確からしさ"),
        uncertainty,
        h("h3", {}, "根拠と出典"),
        evidence,
        h("p", { class: "detail-rights" }, `この表示の権利: ${feature.rights.attribution ?? feature.rights.status}`),
        others.length ? h("h3", {}, "この地点のほかの地物") : null,
        others.length ? choiceList(others) : null,
      );
    },
  };
}
