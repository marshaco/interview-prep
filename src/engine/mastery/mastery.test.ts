import { describe, expect, it } from 'vitest';
import { masteryStars, moduleProgress, updateMastery } from './mastery';
import type { Skill } from '../../content/types';
import type { SkillMastery } from '../../storage/types';

describe('updateMastery', () => {
  it('takes the first attempt as-is rather than blending with a phantom zero prior', () => {
    const result = updateMastery(undefined, 'linked-list/append', 100, 0, '2026-01-01T00:00:00.000Z');
    expect(result).toEqual({
      skillId: 'linked-list/append',
      score: 100,
      attempts: 1,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('blends subsequent attempts via 0.7 attempt / 0.3 prior EWMA', () => {
    const first = updateMastery(undefined, 'linked-list/append', 100, 0, '2026-01-01T00:00:00.000Z');
    const second = updateMastery(first, 'linked-list/append', 50, 0, '2026-01-02T00:00:00.000Z');
    // 0.7 * 50 + 0.3 * 100 = 35 + 30 = 65
    expect(second.score).toBe(65);
    expect(second.attempts).toBe(2);
  });

  it('caps the effective attempt score at 60 when 3+ hints were used', () => {
    const result = updateMastery(undefined, 'linked-list/append', 100, 3, '2026-01-01T00:00:00.000Z');
    expect(result.score).toBe(60);
  });

  it('does not cap the attempt score when fewer than 3 hints were used', () => {
    const result = updateMastery(undefined, 'linked-list/append', 100, 2, '2026-01-01T00:00:00.000Z');
    expect(result.score).toBe(100);
  });

  it('applies the hint cap to the current attempt only, not the blended prior', () => {
    const first = updateMastery(undefined, 'linked-list/append', 100, 0, '2026-01-01T00:00:00.000Z');
    const second = updateMastery(first, 'linked-list/append', 100, 4, '2026-01-02T00:00:00.000Z');
    // 0.7 * 60 (capped) + 0.3 * 100 = 42 + 30 = 72
    expect(second.score).toBe(72);
  });
});

describe('masteryStars', () => {
  it('floors score/20 into a 0-5 star range', () => {
    expect(masteryStars({ skillId: 's', score: 0, attempts: 5, updatedAt: '' })).toBe(0);
    expect(masteryStars({ skillId: 's', score: 39, attempts: 5, updatedAt: '' })).toBe(1);
    expect(masteryStars({ skillId: 's', score: 100, attempts: 5, updatedAt: '' })).toBe(5);
  });

  it('caps stars at 3 when fewer than 2 attempts have been recorded', () => {
    expect(masteryStars({ skillId: 's', score: 100, attempts: 1, updatedAt: '' })).toBe(3);
    expect(masteryStars({ skillId: 's', score: 40, attempts: 1, updatedAt: '' })).toBe(2);
  });

  it('does not cap stars once 2+ attempts have been recorded', () => {
    expect(masteryStars({ skillId: 's', score: 100, attempts: 2, updatedAt: '' })).toBe(5);
  });
});

describe('moduleProgress', () => {
  const skill = (id: string): Skill => ({ id, moduleId: 'm', title: id, kind: 'method' });
  const mastery = (skillId: string, score: number, attempts = 2): SkillMastery => ({
    skillId,
    score,
    attempts,
    updatedAt: '',
  });

  it('is 0 for a module with no skills', () => {
    expect(moduleProgress([], new Map())).toBe(0);
  });

  it('treats a never-attempted skill as 0 stars, not as excluded from the average', () => {
    const skills = [skill('a'), skill('b')];
    const masteryBySkill = new Map([['a', mastery('a', 100)]]); // 5 stars; 'b' has no record
    // (5 + 0) / (2 skills * 5 max) = 0.5
    expect(moduleProgress(skills, masteryBySkill)).toBe(0.5);
  });

  it('is 1 when every skill is at 5 stars', () => {
    const skills = [skill('a'), skill('b')];
    const masteryBySkill = new Map([
      ['a', mastery('a', 100)],
      ['b', mastery('b', 100)],
    ]);
    expect(moduleProgress(skills, masteryBySkill)).toBe(1);
  });
});
