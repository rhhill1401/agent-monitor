/**
 * Unit Tests for Agent Monitor Validators
 * 
 * Comprehensive test coverage including edge cases.
 * Run with: npm test or npx jest
 * 
 * @author Franky 🐙
 */

const {
  validateAgent,
  validateAgents,
  validateDailyGoals,
  validateProgress,
  runQACheck,
  AGENT_REQUIRED_FIELDS,
  DAILY_GOAL_KEYS
} = require('../lib/validators');

describe('validateAgent', () => {
  const validAgent = {
    id: 'b6e218d3-test-agent',
    name: 'test-agent',
    status: 'ok',
    state: {
      lastRunAtMs: Date.now() - 60000,
      nextRunAtMs: Date.now() + 60000,
      lastDurationMs: 5000,
      lastStatus: 'ok'
    }
  };

  test('accepts valid agent', () => {
    const result = validateAgent(validAgent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects null/undefined', () => {
    expect(validateAgent(null).valid).toBe(false);
    expect(validateAgent(undefined).valid).toBe(false);
    expect(validateAgent('string').valid).toBe(false);
  });

  test('requires id field', () => {
    const agent = { name: 'test' };
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: id');
  });

  test('requires name field', () => {
    const agent = { id: 'test12345678' };
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: name');
  });

  test('validates id length (minimum 8 chars)', () => {
    const agent = { id: 'short', name: 'test' };
    const result = validateAgent(agent);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Invalid ID format'))).toBe(true);
  });

  test('warns on missing state object', () => {
    const agent = { id: 'test12345678', name: 'test' };
    const result = validateAgent(agent);
    expect(result.valid).toBe(true); // Missing state is warning, not error
    expect(result.warnings.some(w => w.includes('Missing state object'))).toBe(true);
  });

  test('warns on missing state fields', () => {
    const agent = {
      id: 'test12345678',
      name: 'test',
      state: { lastRunAtMs: Date.now() } // Missing nextRunAtMs and lastDurationMs
    };
    const result = validateAgent(agent);
    expect(result.warnings.some(w => w.includes('nextRunAtMs'))).toBe(true);
    expect(result.warnings.some(w => w.includes('lastDurationMs'))).toBe(true);
  });

  test('detects overdue agents', () => {
    const agent = {
      id: 'test12345678',
      name: 'overdue-agent',
      state: {
        lastRunAtMs: Date.now() - 7200000, // 2 hours ago
        nextRunAtMs: Date.now() - 3600000, // Was due 1 hour ago
        lastDurationMs: 5000
      }
    };
    const result = validateAgent(agent);
    expect(result.errors.some(e => e.includes('OVERDUE'))).toBe(true);
  });

  test('handles edge case: far future nextRunAtMs', () => {
    const agent = {
      id: 'test12345678',
      name: 'future-agent',
      state: {
        lastRunAtMs: Date.now(),
        nextRunAtMs: Date.now() + (400 * 24 * 60 * 60 * 1000), // 400 days ahead
        lastDurationMs: 5000
      }
    };
    const result = validateAgent(agent);
    expect(result.warnings.some(w => w.includes('nextRunAtMs looks invalid'))).toBe(true);
  });

  test('handles edge case: lastRunAtMs in the future', () => {
    const agent = {
      id: 'test12345678',
      name: 'time-traveler',
      state: {
        lastRunAtMs: Date.now() + 60000, // 1 min in future
        nextRunAtMs: Date.now() + 120000,
        lastDurationMs: 5000
      }
    };
    const result = validateAgent(agent);
    expect(result.warnings.some(w => w.includes('lastRunAtMs looks invalid'))).toBe(true);
  });

  test('handles edge case: extremely long duration', () => {
    const agent = {
      id: 'test12345678',
      name: 'slow-agent',
      state: {
        lastRunAtMs: Date.now() - 60000,
        nextRunAtMs: Date.now() + 60000,
        lastDurationMs: 7200000 // 2 hours
      }
    };
    const result = validateAgent(agent);
    expect(result.warnings.some(w => w.includes('Duration unusually long'))).toBe(true);
  });
});

describe('validateAgents', () => {
  const validAgents = [
    { id: 'agent001111', name: 'agent-1', state: { lastRunAtMs: Date.now(), nextRunAtMs: Date.now() + 60000, lastDurationMs: 1000 } },
    { id: 'agent002222', name: 'agent-2', state: { lastRunAtMs: Date.now(), nextRunAtMs: Date.now() + 60000, lastDurationMs: 2000 } },
    { id: 'agent003333', name: 'agent-3', state: { lastRunAtMs: Date.now(), nextRunAtMs: Date.now() + 60000, lastDurationMs: 3000 } },
    { id: 'agent004444', name: 'agent-4', state: { lastRunAtMs: Date.now(), nextRunAtMs: Date.now() + 60000, lastDurationMs: 4000 } },
    { id: 'agent005555', name: 'agent-5', state: { lastRunAtMs: Date.now(), nextRunAtMs: Date.now() + 60000, lastDurationMs: 5000 } },
  ];

  test('accepts valid agents array', () => {
    const result = validateAgents(validAgents);
    expect(result.valid).toBe(true);
    expect(result.agentCount).toBe(5);
  });

  test('rejects non-array', () => {
    expect(validateAgents({}).valid).toBe(false);
    expect(validateAgents('agents').valid).toBe(false);
    expect(validateAgents(null).valid).toBe(false);
  });

  test('rejects empty array', () => {
    const result = validateAgents([]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Agents array is empty');
  });

  test('detects duplicate IDs', () => {
    const agents = [
      { id: 'duplicate123', name: 'agent-1' },
      { id: 'duplicate123', name: 'agent-2' },
    ];
    const result = validateAgents(agents);
    expect(result.errors).toContain('Duplicate agent IDs detected');
  });

  test('warns on low agent count', () => {
    const agents = [{ id: 'single12345', name: 'lonely-agent' }];
    const result = validateAgents(agents);
    expect(result.warnings.some(w => w.includes('Only 1 agents'))).toBe(true);
  });

  test('aggregates errors from individual agents', () => {
    const agents = [
      { id: 'valid1234567', name: 'valid-agent' },
      { name: 'missing-id' }, // Invalid
    ];
    const result = validateAgents(agents);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: id');
  });
});

describe('validateDailyGoals', () => {
  const validGoals = {
    contacts: { current: 5, target: 20 },
    responses: { current: 1, target: 2 },
    posts: { current: 2, target: 3 },
    engagement: { current: 10, target: 15 },
    xFollowers: { current: 3, target: 16 },
    ytSubs: { current: 5, target: 17 }
  };

  test('accepts valid daily goals', () => {
    const result = validateDailyGoals(validGoals);
    expect(result.valid).toBe(true);
  });

  test('rejects non-object', () => {
    expect(validateDailyGoals(null).valid).toBe(false);
    expect(validateDailyGoals('goals').valid).toBe(false);
  });

  test('warns on missing keys', () => {
    const result = validateDailyGoals({ contacts: { current: 5 } });
    expect(result.warnings.some(w => w.includes('Missing dailyGoal key: responses'))).toBe(true);
  });

  test('rejects non-numeric current values', () => {
    const goals = { contacts: { current: 'five', target: 20 } };
    const result = validateDailyGoals(goals);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('must be a number'))).toBe(true);
  });

  test('rejects negative current values', () => {
    const goals = { contacts: { current: -5, target: 20 } };
    const result = validateDailyGoals(goals);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('cannot be negative'))).toBe(true);
  });

  test('warns on suspiciously high values', () => {
    const goals = { contacts: { current: 500, target: 20 } }; // 25x target
    const result = validateDailyGoals(goals);
    expect(result.warnings.some(w => w.includes('unusually high'))).toBe(true);
  });

  test('handles edge case: zero target', () => {
    const goals = { contacts: { current: 0, target: 0 } };
    const result = validateDailyGoals(goals);
    expect(result.valid).toBe(true); // Zero is valid
  });
});

describe('validateProgress', () => {
  const validProgress = {
    lastUpdated: new Date().toISOString(),
    updatedBy: 'test',
    goals: {
      xFollowers: { current: 35, target: 100 },
      youtubeSubs: { current: 108, target: 300 }
    },
    dailyGoals: {
      contacts: { current: 5, target: 20 },
      responses: { current: 1, target: 2 },
      posts: { current: 2, target: 3 },
      engagement: { current: 10, target: 15 },
      xFollowers: { current: 3, target: 16 },
      ytSubs: { current: 5, target: 17 }
    }
  };

  test('accepts valid progress', () => {
    const result = validateProgress(validProgress);
    expect(result.valid).toBe(true);
  });

  test('rejects non-object', () => {
    expect(validateProgress(null).valid).toBe(false);
  });

  test('warns on missing lastUpdated', () => {
    const progress = { goals: { xFollowers: { current: 35 } } };
    const result = validateProgress(progress);
    expect(result.warnings.some(w => w.includes('no lastUpdated'))).toBe(true);
  });

  test('warns on stale data (> 1 hour)', () => {
    const progress = {
      lastUpdated: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      goals: { xFollowers: { current: 35 } }
    };
    const result = validateProgress(progress);
    expect(result.warnings.some(w => w.includes('minutes ago'))).toBe(true);
  });

  test('rejects non-numeric follower counts', () => {
    const progress = {
      lastUpdated: new Date().toISOString(),
      goals: { xFollowers: { current: 'thirty-five' } }
    };
    const result = validateProgress(progress);
    expect(result.valid).toBe(false);
  });
});

describe('runQACheck', () => {
  const validData = {
    agents: [
      { id: 'agent001111', name: 'agent-1', status: 'ok', state: { lastRunAtMs: Date.now() - 60000, nextRunAtMs: Date.now() + 60000, lastDurationMs: 1000 } },
      { id: 'agent002222', name: 'agent-2', status: 'ok', state: { lastRunAtMs: Date.now() - 60000, nextRunAtMs: Date.now() + 60000, lastDurationMs: 2000 } },
      { id: 'agent003333', name: 'agent-3', status: 'ok', state: { lastRunAtMs: Date.now() - 60000, nextRunAtMs: Date.now() + 60000, lastDurationMs: 3000 } },
      { id: 'agent004444', name: 'agent-4', status: 'ok', state: { lastRunAtMs: Date.now() - 60000, nextRunAtMs: Date.now() + 60000, lastDurationMs: 4000 } },
      { id: 'agent005555', name: 'agent-5', status: 'ok', state: { lastRunAtMs: Date.now() - 60000, nextRunAtMs: Date.now() + 60000, lastDurationMs: 5000 } },
    ],
    progress: {
      lastUpdated: new Date().toISOString(),
      goals: {
        xFollowers: { current: 35, target: 100 },
        youtubeSubs: { current: 108, target: 300 }
      },
      dailyGoals: {
        contacts: { current: 5, target: 20 },
        responses: { current: 1, target: 2 },
        posts: { current: 2, target: 3 },
        engagement: { current: 10, target: 15 },
        xFollowers: { current: 3, target: 16 },
        ytSubs: { current: 5, target: 17 }
      }
    }
  };

  test('passes with valid data', () => {
    const report = runQACheck(validData);
    expect(report.passed).toBe(true);
    expect(report.criticalErrors).toHaveLength(0);
  });

  test('includes timestamp', () => {
    const report = runQACheck(validData);
    expect(report.timestamp).toBeDefined();
    expect(new Date(report.timestamp)).toBeInstanceOf(Date);
  });

  test('counts status correctly', () => {
    const report = runQACheck(validData);
    expect(report.summary.statusCounts.ok).toBe(5);
  });

  test('detects overdue agents', () => {
    const dataWithOverdue = {
      ...validData,
      agents: [
        ...validData.agents,
        { 
          id: 'overdue12345', 
          name: 'overdue-agent', 
          state: { 
            lastRunAtMs: Date.now() - 7200000, 
            nextRunAtMs: Date.now() - 3600000, // 1 hour overdue
            lastDurationMs: 1000 
          } 
        }
      ]
    };
    const report = runQACheck(dataWithOverdue);
    expect(report.passed).toBe(false);
    expect(report.summary.overdueAgents).toBeDefined();
    expect(report.summary.overdueAgents.length).toBe(1);
  });

  test('handles empty data gracefully', () => {
    const report = runQACheck({});
    expect(report.passed).toBe(false);
    expect(report.criticalErrors.length).toBeGreaterThan(0);
  });

  test('handles missing agents gracefully', () => {
    const report = runQACheck({ progress: validData.progress });
    expect(report.passed).toBe(false);
    expect(report.summary.agentCount).toBe(0);
  });

  test('handles missing progress gracefully', () => {
    const report = runQACheck({ agents: validData.agents });
    // When progress is missing/undefined, validation fails
    // But overall QA may still pass if agents are healthy
    expect(report.details.progress).toBeDefined();
    expect(report.warnings.length).toBeGreaterThan(0); // Should have warnings about missing data
  });
});

describe('edge cases', () => {
  test('handles agent with empty state object', () => {
    const agent = { id: 'test12345678', name: 'empty-state', state: {} };
    const result = validateAgent(agent);
    expect(result.valid).toBe(true); // Empty state is valid, just has warnings
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test('handles agent with null state fields', () => {
    const agent = {
      id: 'test12345678',
      name: 'null-fields',
      state: { lastRunAtMs: null, nextRunAtMs: null, lastDurationMs: null }
    };
    const result = validateAgent(agent);
    // Should not throw, just warn
    expect(result).toBeDefined();
  });

  test('handles progress with deeply nested nulls', () => {
    const progress = {
      lastUpdated: new Date().toISOString(),
      goals: { xFollowers: null, youtubeSubs: null },
      dailyGoals: null
    };
    const result = validateProgress(progress);
    // Should not throw
    expect(result).toBeDefined();
  });

  test('handles very large agent count', () => {
    const agents = Array(100).fill(null).map((_, i) => ({
      id: `agent${i.toString().padStart(10, '0')}`,
      name: `agent-${i}`,
      state: { lastRunAtMs: Date.now(), nextRunAtMs: Date.now() + 60000, lastDurationMs: 1000 }
    }));
    const result = validateAgents(agents);
    expect(result.valid).toBe(true);
    expect(result.agentCount).toBe(100);
  });

  test('handles unicode in agent names', () => {
    const agent = { id: 'test12345678', name: '🐙 Franky Agent', state: {} };
    const result = validateAgent(agent);
    expect(result.valid).toBe(true);
  });

  test('handles very long agent names', () => {
    const agent = { id: 'test12345678', name: 'a'.repeat(1000), state: {} };
    const result = validateAgent(agent);
    expect(result.valid).toBe(true); // Long names are valid
  });
});
