import type { CodeQuestion, ModuleId, QuestionId, RoadmapModule } from './types';
import { append } from './modules/linked-list/questions/append';
import { prepend } from './modules/linked-list/questions/prepend';
import { deleteValue } from './modules/linked-list/questions/deleteValue';
import { search } from './modules/linked-list/questions/search';
import { reverse } from './modules/linked-list/questions/reverse';
import { findMiddle } from './modules/linked-list/questions/findMiddle';
import { detectCycle } from './modules/linked-list/questions/detectCycle';
import { mergeTwoSorted } from './modules/linked-list/questions/mergeTwoSorted';
import { buildSinglyLinkedList } from './modules/linked-list/questions/buildSinglyLinkedList';
import { buildDoublyLinkedList } from './modules/linked-list/questions/buildDoublyLinkedList';
import { buildCircularLinkedList } from './modules/linked-list/questions/buildCircularLinkedList';
import { step1Append } from './modules/linked-list/questions/guidedBuild/step1Append';
import { step2Prepend } from './modules/linked-list/questions/guidedBuild/step2Prepend';
import { step3Delete } from './modules/linked-list/questions/guidedBuild/step3Delete';
import { step4Search } from './modules/linked-list/questions/guidedBuild/step4Search';
import { roadmapModules } from './roadmap';

export const questions: CodeQuestion[] = [
  append,
  prepend,
  deleteValue,
  search,
  reverse,
  findMiddle,
  detectCycle,
  mergeTwoSorted,
  buildSinglyLinkedList,
  buildDoublyLinkedList,
  buildCircularLinkedList,
  step1Append,
  step2Prepend,
  step3Delete,
  step4Search,
];

export const questionsById: ReadonlyMap<QuestionId, CodeQuestion> = new Map(
  questions.map((question) => [question.id, question]),
);

export function getQuestion(id: QuestionId): CodeQuestion | undefined {
  return questionsById.get(id);
}

export const modules: RoadmapModule[] = roadmapModules;

export const modulesById: ReadonlyMap<ModuleId, RoadmapModule> = new Map(modules.map((mod) => [mod.id, mod]));

export function getModule(id: ModuleId): RoadmapModule | undefined {
  return modulesById.get(id);
}
