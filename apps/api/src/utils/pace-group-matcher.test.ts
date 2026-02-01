import type { PaceGroup, RaceGoal } from '@adaptive-training-plan/types';
import {
  getDefaultPaceGroup,
  matchPaceGroupToTargetTime,
} from '@adaptive-training-plan/utils';
import { describe, expect, it } from 'vitest';

describe('matchPaceGroupToTargetTime', () => {
  const mockPaceGroups: PaceGroup[] = [
    {
      id: 'group-1',
      name: 'Sub 2:00',
      timeRange: {
        maxSeconds: 7200, // 2:00:00
      },
      paces: {
        easy: '6:40-7:10',
        tempo: '5:50-6:00',
      },
    },
    {
      id: 'group-2',
      name: '2:00-2:20',
      timeRange: {
        minSeconds: 7200, // 2:00:00
        maxSeconds: 8400, // 2:20:00
      },
      paces: {
        easy: '7:25-8:00',
        tempo: '6:25-6:40',
      },
    },
    {
      id: 'group-3',
      name: 'Finish Strong',
      // No time range
      paces: {
        easy: 'Conversational',
      },
    },
  ];

  it('should match target time within range', () => {
    const raceGoal: RaceGoal = {
      distance: 21097.5, // Half marathon
      distanceLabel: 'Half Marathon',
      targetTimeSeconds: 8100, // 2:15:00 - should match group-2
      vdot: 45,
      paces: {
        easy: { minPace: 420, maxPace: 450 },
        longRun: { minPace: 420, maxPace: 450 },
        marathon: { minPace: 360, maxPace: 380 },
        threshold: { minPace: 340, maxPace: 360 },
        interval: { minPace: 320, maxPace: 340 },
        repetition: { minPace: 300, maxPace: 320 },
      },
      calculatedAt: new Date(),
    };

    const matched = matchPaceGroupToTargetTime(raceGoal, mockPaceGroups);

    expect(matched).toBeDefined();
    expect(matched?.id).toBe('group-2');
    expect(matched?.name).toBe('2:00-2:20');
  });

  it('should match target time at lower boundary', () => {
    const raceGoal: RaceGoal = {
      distance: 21097.5,
      distanceLabel: 'Half Marathon',
      targetTimeSeconds: 7200, // Exactly 2:00:00
      vdot: 50,
      paces: {
        easy: { minPace: 400, maxPace: 430 },
        longRun: { minPace: 400, maxPace: 430 },
        marathon: { minPace: 340, maxPace: 360 },
        threshold: { minPace: 320, maxPace: 340 },
        interval: { minPace: 300, maxPace: 320 },
        repetition: { minPace: 280, maxPace: 300 },
      },
      calculatedAt: new Date(),
    };

    const matched = matchPaceGroupToTargetTime(raceGoal, mockPaceGroups);

    expect(matched).toBeDefined();
    // Should match group-2 (2:00-2:20) since 7200 is >= minSeconds
    expect(matched?.id).toBe('group-2');
  });

  it('should match target time below max-only range', () => {
    const raceGoal: RaceGoal = {
      distance: 21097.5,
      distanceLabel: 'Half Marathon',
      targetTimeSeconds: 6900, // 1:55:00 - below 2:00
      vdot: 55,
      paces: {
        easy: { minPace: 380, maxPace: 410 },
        longRun: { minPace: 380, maxPace: 410 },
        marathon: { minPace: 320, maxPace: 340 },
        threshold: { minPace: 300, maxPace: 320 },
        interval: { minPace: 280, maxPace: 300 },
        repetition: { minPace: 260, maxPace: 280 },
      },
      calculatedAt: new Date(),
    };

    const matched = matchPaceGroupToTargetTime(raceGoal, mockPaceGroups);

    expect(matched).toBeDefined();
    expect(matched?.id).toBe('group-1'); // Sub 2:00
  });

  it('should return closest match when no exact match', () => {
    const raceGoal: RaceGoal = {
      distance: 21097.5,
      distanceLabel: 'Half Marathon',
      targetTimeSeconds: 9000, // 2:30:00 - beyond all ranges
      vdot: 40,
      paces: {
        easy: { minPace: 450, maxPace: 480 },
        longRun: { minPace: 450, maxPace: 480 },
        marathon: { minPace: 400, maxPace: 420 },
        threshold: { minPace: 380, maxPace: 400 },
        interval: { minPace: 360, maxPace: 380 },
        repetition: { minPace: 340, maxPace: 360 },
      },
      calculatedAt: new Date(),
    };

    const matched = matchPaceGroupToTargetTime(raceGoal, mockPaceGroups);

    // Should return closest match (group-2 with max 8400)
    expect(matched).toBeDefined();
    expect(matched?.id).toBe('group-2');
  });

  it('should return null when no pace groups provided', () => {
    const raceGoal: RaceGoal = {
      distance: 21097.5,
      distanceLabel: 'Half Marathon',
      targetTimeSeconds: 8100,
      vdot: 45,
      paces: {
        easy: { minPace: 420, maxPace: 450 },
        longRun: { minPace: 420, maxPace: 450 },
        marathon: { minPace: 360, maxPace: 380 },
        threshold: { minPace: 340, maxPace: 360 },
        interval: { minPace: 320, maxPace: 340 },
        repetition: { minPace: 300, maxPace: 320 },
      },
      calculatedAt: new Date(),
    };

    const matched = matchPaceGroupToTargetTime(raceGoal, []);

    expect(matched).toBeNull();
  });
});

describe('getDefaultPaceGroup', () => {
  it('should return first pace group when available', () => {
    const paceGroups: PaceGroup[] = [
      {
        id: 'group-1',
        name: 'Sub 2:00',
        paces: {},
      },
      {
        id: 'group-2',
        name: '2:00-2:20',
        paces: {},
      },
    ];

    const defaultGroup = getDefaultPaceGroup(paceGroups);

    expect(defaultGroup).toBeDefined();
    expect(defaultGroup?.id).toBe('group-1');
  });

  it('should return null when no pace groups', () => {
    const defaultGroup = getDefaultPaceGroup([]);

    expect(defaultGroup).toBeNull();
  });
});
