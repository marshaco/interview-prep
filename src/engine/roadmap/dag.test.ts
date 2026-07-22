import { describe, expect, it } from 'vitest';
import { computeModuleDepths, orderModulesByDag } from './dag';
import type { RoadmapModule } from '../../content/types';

function fakeModule(id: string, prerequisites: string[] = []): RoadmapModule {
  return { id, kind: 'algorithm', title: id, summary: '', prerequisites, skills: [], stages: [] };
}

describe('computeModuleDepths', () => {
  it('gives roots (no prerequisites) depth 0', () => {
    const depths = computeModuleDepths([fakeModule('a'), fakeModule('b')]);
    expect(depths.get('a')).toBe(0);
    expect(depths.get('b')).toBe(0);
  });

  it('is one more than the deepest prerequisite', () => {
    const depths = computeModuleDepths([fakeModule('a'), fakeModule('b', ['a']), fakeModule('c', ['b'])]);
    expect(depths.get('a')).toBe(0);
    expect(depths.get('b')).toBe(1);
    expect(depths.get('c')).toBe(2);
  });

  it('takes the longest path when a module has multiple prerequisites at different depths', () => {
    const depths = computeModuleDepths([
      fakeModule('a'),
      fakeModule('b', ['a']),
      fakeModule('c', ['b']),
      fakeModule('d', ['a', 'c']), // depth via 'a' is 1, via 'c' is 3 -> takes 3
    ]);
    expect(depths.get('d')).toBe(3);
  });
});

describe('orderModulesByDag', () => {
  it('orders roots before their dependents', () => {
    const modules = [fakeModule('child', ['root']), fakeModule('root')];
    const ordered = orderModulesByDag(modules);
    expect(ordered.map((m) => m.id)).toEqual(['root', 'child']);
  });

  it('preserves input order among modules at the same depth', () => {
    const modules = [fakeModule('b'), fakeModule('a')];
    const ordered = orderModulesByDag(modules);
    expect(ordered.map((m) => m.id)).toEqual(['b', 'a']);
  });
});
