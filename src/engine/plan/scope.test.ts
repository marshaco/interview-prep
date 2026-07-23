import { describe, expect, it } from 'vitest';
import { resolveScopeModuleIds } from './scope';
import type { RoadmapModule } from '../../content/types';

function fakeModule(id: string, prerequisites: string[], authored = true): RoadmapModule {
  return {
    id,
    kind: 'algorithm',
    title: id,
    summary: '',
    prerequisites,
    skills: [],
    stages: authored ? [{ type: 'algorithm_drills', title: 'Drills', items: [{ type: 'question', questionId: `${id}/q1` }] }] : [],
  };
}

describe('resolveScopeModuleIds', () => {
  it("'all' resolves to every authored module, excluding ghosts", () => {
    const modules = [fakeModule('a', []), fakeModule('b', ['a']), fakeModule('ghost', [], false)];
    expect(resolveScopeModuleIds('all', modules)).toEqual(new Set(['a', 'b']));
  });

  it('a specific module resolves to itself plus its transitive prerequisite ancestors', () => {
    const modules = [fakeModule('root', []), fakeModule('mid', ['root']), fakeModule('leaf', ['mid']), fakeModule('unrelated', [])];
    expect(resolveScopeModuleIds('leaf', modules)).toEqual(new Set(['root', 'mid', 'leaf']));
  });

  it('skips an unauthored ancestor rather than blocking the whole scope', () => {
    const modules = [fakeModule('root', [], false), fakeModule('leaf', ['root'])];
    expect(resolveScopeModuleIds('leaf', modules)).toEqual(new Set(['leaf']));
  });

  it('handles diamond dependencies without duplication or infinite recursion', () => {
    const modules = [fakeModule('root', []), fakeModule('left', ['root']), fakeModule('right', ['root']), fakeModule('top', ['left', 'right'])];
    expect(resolveScopeModuleIds('top', modules)).toEqual(new Set(['root', 'left', 'right', 'top']));
  });
});
