export type ExamType = "IOE" | "CEE";
export type Difficulty = "easy" | "medium" | "hard" | "mixed";
export type TestMode = "full" | "subject";

export interface Question {
  id: string;
  subject: string;
  topic?: string;
  text: string;
  options: string[]; // length 4
  correctIndex: number;
  explanation?: string;
  difficulty: Difficulty;
  marks: number;
  negativeMarks?: number;
}

export interface MockTest {
  id: string;
  exam: ExamType;
  title: string;
  mode: TestMode;
  subject?: string;
  difficulty: Difficulty;
  durationMinutes: number;
  questions: Question[];
}

export interface Attempt {
  testId: string;
  exam: ExamType;
  title: string;
  answers: Record<string, number | null>; // qid -> selected index or null
  marked: Record<string, boolean>;
  startedAt: number;
  submittedAt: number;
  durationSeconds: number;
  subjectTimes?: Record<string, number>; // subject -> seconds spent
}

export interface AttemptSummary {
  attemptId: string;
  testId: string;
  exam: ExamType;
  title: string;
  date: number;
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  durationSeconds: number;
  bySubject: Record<string, { correct: number; incorrect: number; total: number; accuracy: number }>;
}

export interface ExamMeta {
  id: ExamType;
  name: string;
  description: string;
  subjects: string[];
  totalQuestions: number;
  durationMinutes: number;
}
