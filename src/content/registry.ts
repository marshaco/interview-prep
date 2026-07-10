import type { CodeQuestion, QuestionId } from './types';
import { append } from './modules/linked-list/questions/append';
import { prepend } from './modules/linked-list/questions/prepend';
import { deleteValue } from './modules/linked-list/questions/deleteValue';
import { search } from './modules/linked-list/questions/search';
import { reverse } from './modules/linked-list/questions/reverse';
import { findMiddle } from './modules/linked-list/questions/findMiddle';
import { detectCycle } from './modules/linked-list/questions/detectCycle';
import { mergeTwoSorted } from './modules/linked-list/questions/mergeTwoSorted';

export const questions: CodeQuestion[] = [
  append,
  prepend,
  deleteValue,
  search,
  reverse,
  findMiddle,
  detectCycle,
  mergeTwoSorted,
];

export const questionsById: ReadonlyMap<QuestionId, CodeQuestion> = new Map(
  questions.map((question) => [question.id, question]),
);

export function getQuestion(id: QuestionId): CodeQuestion | undefined {
  return questionsById.get(id);
}
