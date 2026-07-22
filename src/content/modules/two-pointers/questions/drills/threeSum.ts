import type { CodeQuestion } from '../../../../types';

const NORMALIZE_TRIPLETS_CHECKER = `def norm(triplets):
    return sorted(tuple(t) for t in triplets)
return norm(got) == norm(expected)`;

export const threeSum: CodeQuestion = {
  id: 'two-pointers/three-sum',
  kind: 'algorithm_problem',
  moduleId: 'two-pointers',
  skillIds: ['two-pointers/pair-sum-sorted'],
  title: '3Sum',
  prompt: `## 3Sum

Given a list of integers, return every unique triplet \`[a, b, c]\` (as a
list of lists) whose values sum to zero. No triplet may repeat, and each
triplet's elements should not include the same index twice.

\`\`\`python
def three_sum(nums):
    ...
\`\`\`

Sort first. Then fix one number at a time and find pairs summing to its
negation in the *rest* of the array — exactly the pair-sum-on-sorted-input
technique, run once per fixed number. Skip over duplicate values at every
position (the fixed number, and both pointers) so the same triplet is
never produced twice.`,
  starterCode: `def three_sum(nums):
    # TODO: return every unique triplet summing to zero.
    pass
`,
  solution: `def three_sum(nums):
    nums = sorted(nums)
    result = []
    n = len(nums)
    for i in range(n):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        left, right = i + 1, n - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1
            elif total > 0:
                right -= 1
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1
    return result
`,
  hints: [
    'Sorting first turns "find three numbers summing to zero" into "for each number, find a pair summing to its negation" — the exact pair-sum-on-sorted-input technique, run once per fixed number.',
    'Skip a fixed number if it\'s the same as the one before it — otherwise you\'d re-find every triplet that number already produced.',
    'for i in range(n): skip duplicates of nums[i]; then run the converging-pointers pair-sum loop on nums[i+1:] looking for a pair summing to -nums[i].',
    'After recording a match, advance both pointers inward and then skip any further duplicate values at the new left and right positions before continuing — that\'s what prevents duplicate triplets.',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'three_sum',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      {
        id: 'classic-example',
        group: 'visible',
        args: [[-1, 0, 1, 2, -1, -4]],
        expected: [
          [-1, -1, 2],
          [-1, 0, 1],
        ],
        comparator: 'checker',
        checker: NORMALIZE_TRIPLETS_CHECKER,
      },
      {
        id: 'all-zeros',
        group: 'visible',
        args: [[0, 0, 0]],
        expected: [[0, 0, 0]],
        comparator: 'checker',
        checker: NORMALIZE_TRIPLETS_CHECKER,
      },
      {
        id: 'no-valid-triplet',
        group: 'hidden',
        args: [[0, 1, 1]],
        expected: [],
        comparator: 'checker',
        checker: NORMALIZE_TRIPLETS_CHECKER,
        label: 'no triplet sums to zero',
      },
      {
        id: 'requires-deduplication',
        group: 'hidden',
        args: [[-2, 0, 0, 2, 2]],
        expected: [[-2, 0, 2]],
        comparator: 'checker',
        checker: NORMALIZE_TRIPLETS_CHECKER,
        label: 'duplicate values require de-duplication',
      },
      {
        id: 'empty-list',
        group: 'edge',
        args: [[]],
        expected: [],
        comparator: 'checker',
        checker: NORMALIZE_TRIPLETS_CHECKER,
        label: 'empty list',
      },
      {
        id: 'too-few-elements',
        group: 'edge',
        args: [[0, 0]],
        expected: [],
        comparator: 'checker',
        checker: NORMALIZE_TRIPLETS_CHECKER,
        label: 'too few elements for a valid triplet',
      },
    ],
  },
};
