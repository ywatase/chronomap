import type { DatasetCatalogEntry } from "./dataset-catalog";
import type { Lesson } from "./lesson";

/** Resolve a lesson only when its ID is registered for the selected dataset. */
export function selectAllowedLesson(
  entry: DatasetCatalogEntry,
  lessons: Readonly<Record<string, Lesson | null>>,
  requestedLessonId: string | null | undefined,
): Lesson | null {
  if (!requestedLessonId || !entry.lessons.some((candidate) => candidate.id === requestedLessonId)) return null;
  return lessons[requestedLessonId] ?? null;
}
