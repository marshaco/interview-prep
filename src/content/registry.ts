import type { CodeQuestion, ModuleId, QuestionId, RoadmapModule, SkillId } from './types';
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
import { step1FrequencyCount } from './modules/arrays-hashing/questions/guidedApply/step1FrequencyCount';
import { step2HashSetMembership } from './modules/arrays-hashing/questions/guidedApply/step2HashSetMembership';
import { step3AnagramGrouping } from './modules/arrays-hashing/questions/guidedApply/step3AnagramGrouping';
import { step4TwoSumPattern } from './modules/arrays-hashing/questions/guidedApply/step4TwoSumPattern';
import { step5PrefixProducts } from './modules/arrays-hashing/questions/guidedApply/step5PrefixProducts';
import { firstUniqueCharacter } from './modules/arrays-hashing/questions/drills/firstUniqueCharacter';
import { longestConsecutiveSequence } from './modules/arrays-hashing/questions/drills/longestConsecutiveSequence';
import { groupAnagrams } from './modules/arrays-hashing/questions/drills/groupAnagrams';
import { twoSum } from './modules/arrays-hashing/questions/drills/twoSum';
import { productExceptSelf } from './modules/arrays-hashing/questions/drills/productExceptSelf';
import { step1Push } from './modules/stack/questions/guidedBuild/step1Push';
import { step2Pop } from './modules/stack/questions/guidedBuild/step2Pop';
import { step3Peek } from './modules/stack/questions/guidedBuild/step3Peek';
import { step4IsEmpty } from './modules/stack/questions/guidedBuild/step4IsEmpty';
import { buildListBackedStack } from './modules/stack/questions/buildListBackedStack';
import { buildLinkedStack } from './modules/stack/questions/buildLinkedStack';
import { buildMinStack } from './modules/stack/questions/buildMinStack';
import { validParentheses } from './modules/stack/questions/drills/validParentheses';
import { dailyTemperatures } from './modules/stack/questions/drills/dailyTemperatures';
import { nextGreaterElement } from './modules/stack/questions/drills/nextGreaterElement';
import { evaluateRpn } from './modules/stack/questions/drills/evaluateRpn';
import { step1ConvergingPointers } from './modules/two-pointers/questions/guidedApply/step1ConvergingPointers';
import { step2PairSumSorted } from './modules/two-pointers/questions/guidedApply/step2PairSumSorted';
import { step3Partition } from './modules/two-pointers/questions/guidedApply/step3Partition';
import { step4PalindromeCheck } from './modules/two-pointers/questions/guidedApply/step4PalindromeCheck';
import { containerWithMostWater } from './modules/two-pointers/questions/drills/containerWithMostWater';
import { threeSum } from './modules/two-pointers/questions/drills/threeSum';
import { sortColors } from './modules/two-pointers/questions/drills/sortColors';
import { validPalindrome } from './modules/two-pointers/questions/drills/validPalindrome';
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
  step1FrequencyCount,
  step2HashSetMembership,
  step3AnagramGrouping,
  step4TwoSumPattern,
  step5PrefixProducts,
  firstUniqueCharacter,
  longestConsecutiveSequence,
  groupAnagrams,
  twoSum,
  productExceptSelf,
  step1Push,
  step2Pop,
  step3Peek,
  step4IsEmpty,
  buildListBackedStack,
  buildLinkedStack,
  buildMinStack,
  validParentheses,
  dailyTemperatures,
  nextGreaterElement,
  evaluateRpn,
  step1ConvergingPointers,
  step2PairSumSorted,
  step3Partition,
  step4PalindromeCheck,
  containerWithMostWater,
  threeSum,
  sortColors,
  validPalindrome,
];

export const questionsById: ReadonlyMap<QuestionId, CodeQuestion> = new Map(
  questions.map((question) => [question.id, question]),
);

export function getQuestion(id: QuestionId): CodeQuestion | undefined {
  return questionsById.get(id);
}

/**
 * Every skill exercised by at least one shipped question, in question-array
 * order. Used to pad Today's Review with unattempted skills (engine/srs/queue.ts)
 * so the queue is never empty just because nothing's been reviewed yet.
 */
export const allSkillIds: SkillId[] = [...new Set(questions.flatMap((question) => question.skillIds))];

export const modules: RoadmapModule[] = roadmapModules;

export const modulesById: ReadonlyMap<ModuleId, RoadmapModule> = new Map(modules.map((mod) => [mod.id, mod]));

export function getModule(id: ModuleId): RoadmapModule | undefined {
  return modulesById.get(id);
}
