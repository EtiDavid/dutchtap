import rawTopics from "@/data/learning-topics.json";
import rawTasks from "@/data/learning-tasks.json";
import verbs from "@/data/learning-verbs.json";

export type LearningTask = {
  id: string;
  topic: string;
  verb?: string;
  tense: string;
  promptNl: string;
  promptEnglish: string;
  answers: string[];
  english: string;
  explanation: string;
};
export const LEARNING_TOPICS = rawTopics;
export const LEARNING_TASKS = rawTasks as LearningTask[];
export const LEARNING_VERBS = verbs;
export const taskById = new Map(LEARNING_TASKS.map((task) => [task.id, task]));
export const normalizeAnswer = (text: string) =>
  text
    .normalize("NFC")
    .toLocaleLowerCase("nl")
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
export const acceptsAnswer = (task: LearningTask, text: string) =>
  task.answers.some(
    (answer) => normalizeAnswer(answer) === normalizeAnswer(text),
  );

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
