/**
 * Agent Monitor Validators
 * 
 * Production-grade validation for agent and progress data.
 * Written to ensure data integrity across all dashboard operations.
 * 
 * @author Franky 🐙
 * @version 1.0.0
 */

/**
 * Required fields for a valid agent object
 */
const AGENT_REQUIRED_FIELDS = ['id', 'name'];

/**
 * Required fields within agent state
 */
const STATE_REQUIRED_FIELDS = ['lastRunAtMs', 'nextRunAtMs', 'lastDurationMs'];

/**
 * Valid status values
 */
const VALID_STATUSES = ['ok', 'error', 'scheduled', 'running', 'idle', 'fixed'];

/**
 * Daily goals keys that should be present
 */
const DAILY_GOAL_KEYS = ['contacts', 'responses', 'posts', 'engagement', 'xFollowers', 'ytSubs'];

/**
 * Validates a single agent object
 * 
 * @param {Object} agent - Agent object to validate
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
function validateAgent(agent) {
  const errors = [];
  const warnings = [];

  if (!agent || typeof agent !== 'object') {
    return { valid: false, errors: ['Agent must be an object'], warnings: [] };
  }

  // Check required fields
  for (const field of AGENT_REQUIRED_FIELDS) {
    if (!agent[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate ID format (should be string, at least 8 chars)
  if (agent.id && (typeof agent.id !== 'string' || agent.id.length < 8)) {
    errors.push(`Invalid ID format: ${agent.id} (must be string, 8+ chars)`);
  }

  // Check for state object
  if (!agent.state) {
    warnings.push(`Agent ${agent.name || agent.id}: Missing state object`);
  } else {
    // Validate state fields
    for (const field of STATE_REQUIRED_FIELDS) {
      if (agent.state[field] === undefined) {
        // lastDurationMs can be missing for never-run agents
        if (field === 'lastDurationMs' && !agent.state.lastRunAtMs) {
          continue;
        }
        warnings.push(`Agent ${agent.name}: Missing state.${field}`);
      }
    }

    // Validate timestamps are reasonable
    const now = Date.now();
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    const oneYearAhead = now + (365 * 24 * 60 * 60 * 1000);

    if (agent.state.lastRunAtMs) {
      if (agent.state.lastRunAtMs < oneYearAgo || agent.state.lastRunAtMs > now) {
        warnings.push(`Agent ${agent.name}: lastRunAtMs looks invalid (${agent.state.lastRunAtMs})`);
      }
    }

    if (agent.state.nextRunAtMs) {
      if (agent.state.nextRunAtMs < oneYearAgo || agent.state.nextRunAtMs > oneYearAhead) {
        warnings.push(`Agent ${agent.name}: nextRunAtMs looks invalid (${agent.state.nextRunAtMs})`);
      }
    }

    // Check for overdue agents
    if (agent.state.nextRunAtMs && agent.state.nextRunAtMs < now) {
      const overdueMinutes = Math.round((now - agent.state.nextRunAtMs) / 60000);
      if (overdueMinutes > 30) {
        errors.push(`Agent ${agent.name}: OVERDUE by ${overdueMinutes} minutes`);
      } else {
        warnings.push(`Agent ${agent.name}: Overdue by ${overdueMinutes} minutes`);
      }
    }

    // Validate duration is reasonable (< 1 hour)
    if (agent.state.lastDurationMs && agent.state.lastDurationMs > 3600000) {
      warnings.push(`Agent ${agent.name}: Duration unusually long (${Math.round(agent.state.lastDurationMs/1000)}s)`);
    }
  }

  // Validate status if present
  if (agent.status && !VALID_STATUSES.includes(agent.status)) {
    warnings.push(`Agent ${agent.name}: Unknown status "${agent.status}"`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates an array of agents
 * 
 * @param {Array} agents - Array of agent objects
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[], agentCount: number }
 */
function validateAgents(agents) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(agents)) {
    return { valid: false, errors: ['Agents must be an array'], warnings: [], agentCount: 0 };
  }

  if (agents.length === 0) {
    errors.push('Agents array is empty');
    return { valid: false, errors, warnings, agentCount: 0 };
  }

  // Check for duplicates
  const ids = agents.map(a => a.id).filter(Boolean);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate agent IDs detected');
  }

  // Validate each agent
  for (const agent of agents) {
    const result = validateAgent(agent);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Check for minimum expected agents
  if (agents.length < 5) {
    warnings.push(`Only ${agents.length} agents - expected at least 10+`);
  }

  return { valid: errors.length === 0, errors, warnings, agentCount: agents.length };
}

/**
 * Validates daily goals data
 * 
 * @param {Object} dailyGoals - Daily goals object
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
function validateDailyGoals(dailyGoals) {
  const errors = [];
  const warnings = [];

  if (!dailyGoals || typeof dailyGoals !== 'object') {
    return { valid: false, errors: ['dailyGoals must be an object'], warnings: [] };
  }

  // Check for required keys
  for (const key of DAILY_GOAL_KEYS) {
    if (!dailyGoals[key]) {
      warnings.push(`Missing dailyGoal key: ${key}`);
    } else {
      const goal = dailyGoals[key];
      if (typeof goal.current !== 'number') {
        errors.push(`dailyGoals.${key}.current must be a number`);
      }
      if (goal.current < 0) {
        errors.push(`dailyGoals.${key}.current cannot be negative`);
      }
      if (goal.target && goal.current > goal.target * 10) {
        warnings.push(`dailyGoals.${key}.current (${goal.current}) seems unusually high`);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validates progress data
 * 
 * @param {Object} progress - Progress object from API
 * @returns {Object} - { valid: boolean, errors: string[], warnings: string[] }
 */
function validateProgress(progress) {
  const errors = [];
  const warnings = [];

  if (!progress || typeof progress !== 'object') {
    return { valid: false, errors: ['Progress must be an object'], warnings: [] };
  }

  // Check lastUpdated
  if (!progress.lastUpdated) {
    warnings.push('Progress has no lastUpdated timestamp');
  } else {
    const updatedAt = new Date(progress.lastUpdated);
    const hourAgo = Date.now() - (60 * 60 * 1000);
    if (updatedAt.getTime() < hourAgo) {
      warnings.push(`Progress last updated ${Math.round((Date.now() - updatedAt.getTime()) / 60000)} minutes ago`);
    }
  }

  // Validate goals
  if (progress.goals) {
    if (progress.goals.xFollowers) {
      if (typeof progress.goals.xFollowers.current !== 'number') {
        errors.push('goals.xFollowers.current must be a number');
      }
    }
    if (progress.goals.youtubeSubs) {
      if (typeof progress.goals.youtubeSubs.current !== 'number') {
        errors.push('goals.youtubeSubs.current must be a number');
      }
    }
  }

  // Validate daily goals
  if (progress.dailyGoals) {
    const dailyResult = validateDailyGoals(progress.dailyGoals);
    errors.push(...dailyResult.errors);
    warnings.push(...dailyResult.warnings);
  } else {
    warnings.push('Progress missing dailyGoals');
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Performs a complete QA check on dashboard data
 * 
 * @param {Object} data - { agents: [...], progress: {...} }
 * @returns {Object} - Comprehensive QA report
 */
function runQACheck(data) {
  const report = {
    timestamp: new Date().toISOString(),
    passed: true,
    criticalErrors: [],
    warnings: [],
    summary: {},
    details: {}
  };

  // Validate agents
  const agentsResult = validateAgents(data.agents || []);
  report.details.agents = agentsResult;
  report.summary.agentCount = agentsResult.agentCount;
  
  if (!agentsResult.valid) {
    report.passed = false;
    report.criticalErrors.push(...agentsResult.errors);
  }
  report.warnings.push(...agentsResult.warnings);

  // Validate progress
  const progressResult = validateProgress(data.progress || {});
  report.details.progress = progressResult;
  
  if (!progressResult.valid) {
    report.passed = false;
    report.criticalErrors.push(...progressResult.errors);
  }
  report.warnings.push(...progressResult.warnings);

  // Count agents by status
  const statusCounts = { ok: 0, error: 0, scheduled: 0, overdue: 0 };
  const now = Date.now();
  
  for (const agent of (data.agents || [])) {
    const status = agent.status || agent.state?.lastStatus;
    if (status === 'error') {
      statusCounts.error++;
    } else if (agent.state?.nextRunAtMs && agent.state.nextRunAtMs < now - 1800000) {
      // Overdue by > 30 min
      statusCounts.overdue++;
    } else if (agent.state?.lastRunAtMs) {
      statusCounts.ok++;
    } else {
      statusCounts.scheduled++;
    }
  }
  
  report.summary.statusCounts = statusCounts;

  // Check for overdue agents that need alerting
  const overdueAgents = (data.agents || []).filter(a => {
    if (!a.state?.nextRunAtMs) return false;
    return a.state.nextRunAtMs < now - 1800000; // 30+ min overdue
  });
  
  if (overdueAgents.length > 0) {
    report.summary.overdueAgents = overdueAgents.map(a => ({
      name: a.name,
      overdueMinutes: Math.round((now - a.state.nextRunAtMs) / 60000)
    }));
    report.criticalErrors.push(`${overdueAgents.length} agent(s) overdue by 30+ minutes`);
    report.passed = false;
  }

  // Daily goals accuracy check
  const dailyGoals = data.progress?.dailyGoals || {};
  const suspiciousGoals = [];
  
  // Posts should match what's actually visible
  if (dailyGoals.posts?.current === 0 && data.actualPosts > 0) {
    suspiciousGoals.push(`posts shows 0 but ${data.actualPosts} posts exist`);
  }
  
  // Engagement should not be static at 0 if agents are running
  if (dailyGoals.engagement?.current === 0 && statusCounts.ok > 5) {
    suspiciousGoals.push('engagement is 0 but multiple agents are active');
  }

  if (suspiciousGoals.length > 0) {
    report.warnings.push(...suspiciousGoals.map(s => `Suspicious: ${s}`));
  }

  report.summary.totalErrors = report.criticalErrors.length;
  report.summary.totalWarnings = report.warnings.length;

  return report;
}

module.exports = {
  validateAgent,
  validateAgents,
  validateDailyGoals,
  validateProgress,
  runQACheck,
  AGENT_REQUIRED_FIELDS,
  STATE_REQUIRED_FIELDS,
  VALID_STATUSES,
  DAILY_GOAL_KEYS
};
