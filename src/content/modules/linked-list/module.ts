import type { RoadmapModule } from '../../types';
import { linkedListSkills } from './skills';
import { whatIsALinkedList } from './lessons/whatIsALinkedList';
import { nodesAndPointers } from './lessons/nodesAndPointers';
import { theWalkingPattern } from './lessons/theWalkingPattern';
import { step1Append } from './questions/guidedBuild/step1Append';
import { step2Prepend } from './questions/guidedBuild/step2Prepend';
import { step3Delete } from './questions/guidedBuild/step3Delete';
import { step4Search } from './questions/guidedBuild/step4Search';
import { buildSinglyLinkedList } from './questions/buildSinglyLinkedList';
import { buildDoublyLinkedList } from './questions/buildDoublyLinkedList';
import { buildCircularLinkedList } from './questions/buildCircularLinkedList';
import { append } from './questions/append';
import { prepend } from './questions/prepend';
import { deleteValue } from './questions/deleteValue';
import { search } from './questions/search';
import { reverse } from './questions/reverse';
import { findMiddle } from './questions/findMiddle';
import { detectCycle } from './questions/detectCycle';
import { mergeTwoSorted } from './questions/mergeTwoSorted';

export const linkedListModule: RoadmapModule = {
  id: 'linked-list',
  kind: 'data_structure',
  title: 'Linked List',
  summary: 'Build a singly linked list from scratch, then drill each method until it comes from memory.',
  prerequisites: ['two-pointers'],
  skills: linkedListSkills,
  stages: [
    {
      type: 'learn',
      title: 'Learn',
      items: [
        { type: 'lesson', lesson: whatIsALinkedList },
        { type: 'lesson', lesson: nodesAndPointers },
        { type: 'lesson', lesson: theWalkingPattern },
      ],
    },
    {
      type: 'guided_build',
      title: 'Guided Build',
      items: [
        { type: 'question', questionId: step1Append.id },
        { type: 'question', questionId: step2Prepend.id },
        { type: 'question', questionId: step3Delete.id },
        { type: 'question', questionId: step4Search.id },
      ],
    },
    {
      type: 'independent_build',
      title: 'Independent Build',
      items: [
        { type: 'question', questionId: buildSinglyLinkedList.id },
        { type: 'question', questionId: buildDoublyLinkedList.id },
        { type: 'question', questionId: buildCircularLinkedList.id },
      ],
    },
    {
      type: 'method_drills',
      title: 'Method Drills',
      items: [
        { type: 'question', questionId: append.id },
        { type: 'question', questionId: prepend.id },
        { type: 'question', questionId: deleteValue.id },
        { type: 'question', questionId: search.id },
        { type: 'question', questionId: reverse.id },
        { type: 'question', questionId: findMiddle.id },
        { type: 'question', questionId: detectCycle.id },
        { type: 'question', questionId: mergeTwoSorted.id },
      ],
    },
  ],
};
