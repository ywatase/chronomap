import { localizedText } from "../domain/labels";
import type { Lesson } from "../domain/lesson";
import type { UiCopy } from "./copy";

export interface LessonPanelActions {
  readonly onStart: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onClose: () => void;
  readonly onDetails: () => void;
  readonly onShare: () => void;
  readonly onReport: () => void;
  readonly onPack: () => void;
  readonly onWorkshop?: () => void;
}

/** Render the optional static guided lesson without owning map or application state. */
export function renderLessonPanel(
  container: HTMLElement,
  lesson: Lesson | null,
  activeIndex: number | null,
  copy: UiCopy,
  actions: LessonPanelActions,
): void {
  container.replaceChildren();
  if (!lesson) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  const language = copy.language;
  const section = document.createElement("section");
  section.className = activeIndex === null ? "lesson-launch" : "lesson-panel";
  section.dataset.lessonPanel = activeIndex === null ? "idle" : "active";
  section.setAttribute("aria-labelledby", "lesson-title");

  const heading = document.createElement("h2");
  heading.id = "lesson-title";
  heading.textContent = localizedText(lesson.title, language);
  section.append(heading);

  const description = document.createElement("p");
  description.className = "lesson-description";
  description.textContent = localizedText(lesson.description, language);
  section.append(description);

  if (activeIndex === null) {
    const meta = document.createElement("p");
    meta.className = "lesson-meta";
    meta.textContent = `${copy.lessonDuration(lesson.durationMinutes)} · ${copy.lessonStepCount(lesson.steps.length)}`;
    section.append(meta);
    const start = button(copy.lessonStart, "lesson-start");
    start.dataset.lessonStart = "";
    start.addEventListener("click", actions.onStart);
    section.append(start);
    if (actions.onWorkshop) {
      const workshop = button(copy.lessonWorkshopOpen, "lesson-workshop-open");
      workshop.dataset.lessonWorkshopOpen = "";
      workshop.setAttribute("aria-expanded", "false");
      workshop.addEventListener("click", actions.onWorkshop);
      section.append(workshop);
    }
    container.append(section);
    return;
  }

  const step = lesson.steps[activeIndex];
  if (!step) return;
  const progress = document.createElement("p");
  progress.className = "lesson-progress";
  progress.textContent = `${copy.lessonProgress(activeIndex + 1, lesson.steps.length)} · ${copy.lessonStepYear(step.year)}`;
  progress.dataset.lessonProgress = `${activeIndex + 1}/${lesson.steps.length}`;
  section.append(progress);

  const prompt = document.createElement("p");
  prompt.className = "lesson-prompt";
  prompt.textContent = localizedText(step.prompt, language);
  prompt.dataset.lessonPrompt = step.id;
  section.append(prompt);

  if (step.comparisonEntityId) {
    const hint = document.createElement("p");
    hint.className = "lesson-comparison-hint";
    hint.textContent = copy.lessonComparisonHint;
    section.append(hint);
  }

  const details = button(copy.lessonDetails, "lesson-details");
  details.dataset.lessonDetails = "";
  details.addEventListener("click", actions.onDetails);

  const navigation = document.createElement("div");
  navigation.className = "lesson-navigation";
  const previous = button(copy.lessonPrevious, "lesson-previous");
  previous.dataset.lessonPrevious = "";
  previous.disabled = activeIndex === 0;
  previous.addEventListener("click", actions.onPrevious);
  navigation.append(previous);
  if (activeIndex < lesson.steps.length - 1) {
    const next = button(copy.lessonNext, "lesson-next");
    next.dataset.lessonNext = "";
    next.addEventListener("click", actions.onNext);
    navigation.append(next);
  }

  const actionsRow = document.createElement("div");
  actionsRow.className = "lesson-actions";
  actionsRow.append(details, navigation);

  const close = button(copy.lessonClose, "lesson-close");
  close.dataset.lessonClose = "";
  close.addEventListener("click", actions.onClose);
  section.append(actionsRow);

  if (activeIndex === lesson.steps.length - 1) {
    const completion = document.createElement("p");
    completion.className = "lesson-completion";
    completion.textContent = copy.lessonCompletion;
    completion.setAttribute("role", "status");
    section.append(completion);
    const completionActions = document.createElement("div");
    completionActions.className = "lesson-completion-actions";
    const share = button(copy.lessonShare, "lesson-share");
    share.dataset.lessonShare = "";
    share.addEventListener("click", actions.onShare);
    const report = button(copy.lessonReport, "lesson-report");
    report.dataset.lessonReport = "";
    report.addEventListener("click", actions.onReport);
    const pack = button(copy.lessonPackOpen, "lesson-pack-open");
    pack.dataset.lessonPackOpen = "";
    pack.setAttribute("aria-expanded", "false");
    pack.addEventListener("click", actions.onPack);
    completionActions.append(share, report, pack);
    if (actions.onWorkshop) {
      const workshop = button(copy.lessonWorkshopOpen, "lesson-workshop-open");
      workshop.dataset.lessonWorkshopOpen = "";
      workshop.setAttribute("aria-expanded", "false");
      workshop.addEventListener("click", actions.onWorkshop);
      completionActions.append(workshop);
    }
    section.append(completionActions);
  }
  section.append(close);
  container.append(section);
}

function button(label: string, className: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}
