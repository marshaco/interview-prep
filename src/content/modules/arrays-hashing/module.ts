import type { RoadmapModule } from '../../types';
import { arraysHashingSkills } from './skills';
import { whyHashMaps } from './lessons/whyHashMaps';
import { theFrequencyMapPattern } from './lessons/theFrequencyMapPattern';
import { theComplementLookupPattern } from './lessons/theComplementLookupPattern';
import { step1FrequencyCount } from './questions/guidedApply/step1FrequencyCount';
import { step2HashSetMembership } from './questions/guidedApply/step2HashSetMembership';
import { step3AnagramGrouping } from './questions/guidedApply/step3AnagramGrouping';
import { step4TwoSumPattern } from './questions/guidedApply/step4TwoSumPattern';
import { step5PrefixProducts } from './questions/guidedApply/step5PrefixProducts';
import { firstUniqueCharacter } from './questions/drills/firstUniqueCharacter';
import { longestConsecutiveSequence } from './questions/drills/longestConsecutiveSequence';
import { groupAnagrams } from './questions/drills/groupAnagrams';
import { twoSum } from './questions/drills/twoSum';
import { productExceptSelf } from './questions/drills/productExceptSelf';

export const arraysHashingModule: RoadmapModule = {
  id: 'arrays-hashing',
  kind: 'algorithm',
  title: 'Arrays & Hashing',
  summary: 'Frequency counting, seen-sets, prefix sums, and grouping by key — the roadmap root.',
  prerequisites: [],
  skills: arraysHashingSkills,
  stages: [
    {
      type: 'learn',
      title: 'Learn',
      items: [
        { type: 'lesson', lesson: whyHashMaps },
        { type: 'lesson', lesson: theFrequencyMapPattern },
        { type: 'lesson', lesson: theComplementLookupPattern },
      ],
    },
    {
      type: 'guided_apply',
      title: 'Guided Apply',
      items: [
        { type: 'question', questionId: step1FrequencyCount.id },
        { type: 'question', questionId: step2HashSetMembership.id },
        { type: 'question', questionId: step3AnagramGrouping.id },
        { type: 'question', questionId: step4TwoSumPattern.id },
        { type: 'question', questionId: step5PrefixProducts.id },
      ],
    },
    {
      type: 'algorithm_drills',
      title: 'Algorithm Drills',
      items: [
        { type: 'question', questionId: firstUniqueCharacter.id },
        { type: 'question', questionId: longestConsecutiveSequence.id },
        { type: 'question', questionId: groupAnagrams.id },
        { type: 'question', questionId: twoSum.id },
        { type: 'question', questionId: productExceptSelf.id },
      ],
    },
  ],
};
