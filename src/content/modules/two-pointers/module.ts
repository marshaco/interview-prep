import type { RoadmapModule } from '../../types';
import { twoPointersSkills } from './skills';
import { whatAreTwoPointers } from './lessons/whatAreTwoPointers';
import { twoPointersOnSortedInput } from './lessons/twoPointersOnSortedInput';
import { partitioningInPlace } from './lessons/partitioningInPlace';
import { step1ConvergingPointers } from './questions/guidedApply/step1ConvergingPointers';
import { step2PairSumSorted } from './questions/guidedApply/step2PairSumSorted';
import { step3Partition } from './questions/guidedApply/step3Partition';
import { step4PalindromeCheck } from './questions/guidedApply/step4PalindromeCheck';
import { containerWithMostWater } from './questions/drills/containerWithMostWater';
import { threeSum } from './questions/drills/threeSum';
import { sortColors } from './questions/drills/sortColors';
import { validPalindrome } from './questions/drills/validPalindrome';

export const twoPointersModule: RoadmapModule = {
  id: 'two-pointers',
  kind: 'algorithm',
  title: 'Two Pointers',
  summary: 'Converging pointers, partitioning, and pair-sum on sorted input.',
  prerequisites: ['arrays-hashing'],
  skills: twoPointersSkills,
  stages: [
    {
      type: 'learn',
      title: 'Learn',
      items: [
        { type: 'lesson', lesson: whatAreTwoPointers },
        { type: 'lesson', lesson: twoPointersOnSortedInput },
        { type: 'lesson', lesson: partitioningInPlace },
      ],
    },
    {
      type: 'guided_apply',
      title: 'Guided Apply',
      items: [
        { type: 'question', questionId: step1ConvergingPointers.id },
        { type: 'question', questionId: step2PairSumSorted.id },
        { type: 'question', questionId: step3Partition.id },
        { type: 'question', questionId: step4PalindromeCheck.id },
      ],
    },
    {
      type: 'algorithm_drills',
      title: 'Algorithm Drills',
      items: [
        { type: 'question', questionId: containerWithMostWater.id },
        { type: 'question', questionId: threeSum.id },
        { type: 'question', questionId: sortColors.id },
        { type: 'question', questionId: validPalindrome.id },
      ],
    },
  ],
};
