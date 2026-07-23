import { describe, expect, it } from 'vitest';
import { allAuthoredModuleIds, getAncestorModuleIds, resolveScopeModuleIds } from './scope';
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
  it('resolves to exactly the selected ids, no automatic ancestor expansion', () => {
    const modules = [fakeModule('root', []), fakeModule('mid', ['root']), fakeModule('leaf', ['mid'])];
    // 'leaf' selected without its ancestors — scope is exactly ['leaf'], per spec's "nothing is gated" design.
    expect(resolveScopeModuleIds(['leaf'], modules)).toEqual(new Set(['leaf']));
  });

  it('filters out ids that are unauthored or no longer exist', () => {
    const modules = [fakeModule('a', []), fakeModule('ghost', [], false)];
    expect(resolveScopeModuleIds(['a', 'ghost', 'gone'], modules)).toEqual(new Set(['a']));
  });

  it('an empty scope list resolves to nothing', () => {
    const modules = [fakeModule('a', [])];
    expect(resolveScopeModuleIds([], modules)).toEqual(new Set());
  });
});

describe('allAuthoredModuleIds', () => {
  it('lists every authored module, excluding ghosts', () => {
    const modules = [fakeModule('a', []), fakeModule('b', ['a']), fakeModule('ghost', [], false)];
    expect(allAuthoredModuleIds(modules)).toEqual(['a', 'b']);
  });
});

describe('getAncestorModuleIds', () => {
  it('returns transitive prerequisites, not including the module itself', () => {
    const modules = [fakeModule('root', []), fakeModule('mid', ['root']), fakeModule('leaf', ['mid'])];
    expect(getAncestorModuleIds('leaf', modules)).toEqual(new Set(['mid', 'root']));
  });

  it('is empty for a root module with no prerequisites', () => {
    const modules = [fakeModule('root', [])];
    expect(getAncestorModuleIds('root', modules)).toEqual(new Set());
  });

  it('handles diamond dependencies without infinite recursion', () => {
    const modules = [fakeModule('root', []), fakeModule('left', ['root']), fakeModule('right', ['root']), fakeModule('top', ['left', 'right'])];
    expect(getAncestorModuleIds('top', modules)).toEqual(new Set(['left', 'right', 'root']));
  });
});
