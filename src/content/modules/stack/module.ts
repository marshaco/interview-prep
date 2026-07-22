import type { RoadmapModule } from '../../types';
import { stackSkills } from './skills';
import { whatIsAStack } from './lessons/whatIsAStack';
import { twoWaysToBuildAStack } from './lessons/twoWaysToBuildAStack';
import { theMonotonicStackPattern } from './lessons/theMonotonicStackPattern';
import { step1Push } from './questions/guidedBuild/step1Push';
import { step2Pop } from './questions/guidedBuild/step2Pop';
import { step3Peek } from './questions/guidedBuild/step3Peek';
import { step4IsEmpty } from './questions/guidedBuild/step4IsEmpty';
import { buildListBackedStack } from './questions/buildListBackedStack';
import { buildLinkedStack } from './questions/buildLinkedStack';
import { buildMinStack } from './questions/buildMinStack';
import { validParentheses } from './questions/drills/validParentheses';
import { dailyTemperatures } from './questions/drills/dailyTemperatures';
import { nextGreaterElement } from './questions/drills/nextGreaterElement';
import { evaluateRpn } from './questions/drills/evaluateRpn';

export const stackModule: RoadmapModule = {
  id: 'stack',
  kind: 'data_structure',
  title: 'Stack',
  summary: 'Build a stack from scratch, then drill the LIFO application problems it unlocks.',
  prerequisites: ['arrays-hashing'],
  skills: stackSkills,
  stages: [
    {
      type: 'learn',
      title: 'Learn',
      items: [
        { type: 'lesson', lesson: whatIsAStack },
        { type: 'lesson', lesson: twoWaysToBuildAStack },
        { type: 'lesson', lesson: theMonotonicStackPattern },
      ],
    },
    {
      type: 'guided_build',
      title: 'Guided Build',
      items: [
        { type: 'question', questionId: step1Push.id },
        { type: 'question', questionId: step2Pop.id },
        { type: 'question', questionId: step3Peek.id },
        { type: 'question', questionId: step4IsEmpty.id },
      ],
    },
    {
      type: 'independent_build',
      title: 'Independent Build',
      items: [
        { type: 'question', questionId: buildListBackedStack.id },
        { type: 'question', questionId: buildLinkedStack.id },
        { type: 'question', questionId: buildMinStack.id },
      ],
    },
    {
      type: 'method_drills',
      title: 'Method Drills',
      items: [
        { type: 'question', questionId: validParentheses.id },
        { type: 'question', questionId: dailyTemperatures.id },
        { type: 'question', questionId: nextGreaterElement.id },
        { type: 'question', questionId: evaluateRpn.id },
      ],
    },
  ],
};
