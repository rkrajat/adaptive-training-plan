import { detectPaceGroupsFromCsv } from '@adaptive-training-plan/utils';
import { describe, expect, it } from 'vitest';


describe('detectPaceGroupsFromCsv', () => {
  it('should detect pace groups from Target Time row structure', () => {
    const csvContent = `date,day,type,planned_distance_km,target_pace_min_per_km,target_HR_zone,notes
2025-01-26,Mon,Rest,0,,,
2025-01-27,Tue,Easy,5,6:40-7:10,Z2,
2025-01-28,Wed,Rest,0,,,
2025-01-29,Thu,Easy,5,6:40-7:10,Z2,
2025-01-30,Fri,Rest,0,,,
2025-01-31,Sat,Rest,0,,,
2025-02-01,Sun,Long,8,6:40-7:10,Z2,
Target Time,2:00 (HMP ≈5:40–5:50 min/km),2:00–2:20 (HMP ≈6:10–6:30 min/km),Finish Strong,,,
Paces,Easy: HMP + 60–90 sec (6:40–7:10),Easy: HMP + 75–105 sec (7:25-8:00),Easy: Conversational only,,,`;

    const result = detectPaceGroupsFromCsv(csvContent);

    expect(result.error).toBeNull();
    expect(result.paceGroups.length).toBeGreaterThan(0);
    
    // Should detect at least the pace groups from Target Time row
    const groupNames = result.paceGroups.map(g => g.name);
    expect(groupNames.some(name => name.includes('2:00'))).toBe(true);
  });

  it('should handle CSV without pace groups (backward compatibility)', () => {
    const csvContent = `date,day,type,planned_distance_km,target_pace_min_per_km,target_HR_zone,notes
2025-01-26,Mon,Rest,0,,,
2025-01-27,Tue,Easy,5,6:40-7:10,Z2,
2025-01-28,Wed,Rest,0,,,`;

    const result = detectPaceGroupsFromCsv(csvContent);

    expect(result.error).toBeNull();
    expect(result.paceGroups).toEqual([]);
  });

  it('should parse time ranges correctly', () => {
    const csvContent = `date,day,type,planned_distance_km
2025-01-26,Mon,Rest,0
Target Time,2:00,2:00-2:20,Finish Strong
Paces,Easy: 6:40-7:10,Easy: 7:25-8:00,Easy: Conversational`;

    const result = detectPaceGroupsFromCsv(csvContent);

    expect(result.error).toBeNull();
    expect(result.paceGroups.length).toBeGreaterThan(0);
    
    // Check that time ranges are parsed for groups that have them
    const groupsWithTimeRange = result.paceGroups.filter(
      (g) => g.timeRange && (g.timeRange.minSeconds || g.timeRange.maxSeconds)
    );
    // At least one group should have a time range (not "Finish Strong")
    expect(groupsWithTimeRange.length).toBeGreaterThan(0);
  });

  it('should extract pace ranges from Paces row', () => {
    const csvContent = `Target Time,Sub 2:00,2:00-2:20
Paces,Easy: 6:40-7:10 Tempo: 5:50-6:00,Easy: 7:25-8:00 Tempo: 6:25-6:40`;

    const result = detectPaceGroupsFromCsv(csvContent);

    expect(result.error).toBeNull();
    expect(result.paceGroups.length).toBeGreaterThan(0);
    
    // Check that paces are extracted
    const groupWithPaces = result.paceGroups.find(g => Object.keys(g.paces).length > 0);
    expect(groupWithPaces).toBeDefined();
    expect(groupWithPaces?.paces.easy).toBeDefined();
  });

  it('should handle malformed CSV gracefully', () => {
    const csvContent = `invalid,csv,content`;

    const result = detectPaceGroupsFromCsv(csvContent);

    // Should return empty array or error, not crash
    expect(result.paceGroups).toBeDefined();
  });

  it('should correctly parse "2:00" as Sub 2:00 (max-only) for first group', () => {
    const csvContent = `date,day,type,planned_distance_km
2025-01-26,Mon,Rest,0
Target Time,2:00 (HMP ≈5:40–5:50 min/km),2:00–2:20 (HMP ≈6:10–6:30 min/km),Finish Strong
Paces,Easy/Warm Up/Cool Down: HMP + 60–90 sec (6:40–7:10),Easy/Warm Up/Cool Down: HMP + 75–105 sec (7:25-8:00),Easy/Warm Up/Cool Down: Conversational only`;

    const result = detectPaceGroupsFromCsv(csvContent);

    expect(result.error).toBeNull();
    expect(result.paceGroups.length).toBeGreaterThanOrEqual(2);
    
    // First group should be "Sub 2:00" (max-only)
    const firstGroup = result.paceGroups[0];
    expect(firstGroup.timeRange).toBeDefined();
    expect(firstGroup.timeRange?.maxSeconds).toBe(7200); // 2:00:00 in seconds
    expect(firstGroup.timeRange?.minSeconds).toBeUndefined();
    
    // Second group should be range 2:00-2:20
    const secondGroup = result.paceGroups[1];
    expect(secondGroup.timeRange).toBeDefined();
    expect(secondGroup.timeRange?.minSeconds).toBe(7200); // 2:00:00
    expect(secondGroup.timeRange?.maxSeconds).toBe(8400); // 2:20:00
    
    // Check that paces are extracted correctly
    expect(firstGroup.paces.easy).toBe('6:40–7:10');
    expect(secondGroup.paces.easy).toBe('7:25-8:00');
  });
});
