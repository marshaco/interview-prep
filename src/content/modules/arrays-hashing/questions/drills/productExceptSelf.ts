import type { CodeQuestion } from '../../../../types';

export const productExceptSelf: CodeQuestion = {
  id: 'arrays-hashing/product-except-self',
  kind: 'algorithm_problem',
  moduleId: 'arrays-hashing',
  skillIds: ['arrays-hashing/prefix-products'],
  title: 'Product of Array Except Self',
  prompt: `## Product of Array Except Self

Given a list of numbers \`nums\`, return a list \`result\` where
\`result[i]\` is the product of every element except \`nums[i]\` —
**without using division** and in O(n).

\`\`\`python
def product_except_self(nums):
    ...
\`\`\`

Build a prefix-product pass (product of everything to the left of \`i\`),
then a suffix-product pass (everything to the right), and multiply the two
at each index. No division means a zero anywhere in the input can't break
the calculation.`,
  starterCode: `def product_except_self(nums):
    # TODO: return result where result[i] = product of every element except nums[i].
`,
  solution: `def product_except_self(nums):
    n = len(nums)
    result = [1] * n

    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]

    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]

    return result
`,
  hints: [
    'Division would be the obvious shortcut (total product / nums[i]) but breaks the moment any element is 0 — this needs to work without it.',
    'Two passes: left-to-right building the product of everything before each index, then right-to-left multiplying in the product of everything after it.',
    'result[i] starts as the prefix product (everything before i). A second pass walking backward multiplies in the suffix product (everything after i).',
    'First pass: result[i] = running product of nums[0..i-1]. Second pass (reversed): multiply result[i] by the running product of nums[i+1..n-1].',
  ],
  spec: {
    mode: 'function',
    entryPoint: 'product_except_self',
    argTypes: ['value'],
    resultType: 'value',
    tests: [
      { id: 'basic', group: 'visible', args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6], comparator: 'deep' },
      { id: 'four-elements', group: 'visible', args: [[2, 3, 4, 5]], expected: [60, 40, 30, 24], comparator: 'deep' },
      {
        id: 'multiple-zeros',
        group: 'hidden',
        args: [[0, 4, 0]],
        expected: [0, 0, 0],
        comparator: 'deep',
        label: 'multiple zeros',
      },
      {
        id: 'negative-and-zero',
        group: 'hidden',
        args: [[-1, 1, 0, -3, 3]],
        expected: [0, 0, 9, 0, 0],
        comparator: 'deep',
        label: 'negative numbers and a zero',
      },
      {
        id: 'two-elements',
        group: 'edge',
        args: [[1, 1]],
        expected: [1, 1],
        comparator: 'deep',
        label: 'two elements, no zero',
      },
      {
        id: 'single-element',
        group: 'edge',
        args: [[5]],
        expected: [1],
        comparator: 'deep',
        label: 'single element',
      },
    ],
  },
};
