export type QuestionType = 0 | 1 | 2 | 3; // 0: SingleChoice, 1: MultipleChoice, 2: TrueFalse, 3: ShortText

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  0: "SingleChoice",
  1: "MultipleChoice",
  2: "TrueFalse",
  3: "ShortText",
} as const;

export type Question = {
  id: number;
  text: string;
  type: QuestionType;
  // For choice-based questions
  choices?: string[];
};

export type AnswerValue = string | string[] | boolean | undefined;

export type SubmitResult = {
  isCorrect: boolean;
  awardedXp: number;
};

export type SubmitAnswerFn = (
  question: Question,
  answer: AnswerValue
) => Promise<SubmitResult>;
