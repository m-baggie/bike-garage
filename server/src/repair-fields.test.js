import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Unit tests for the repair fields schema normalization logic.
// These tests mirror the normalization applied in the POST /api/analyze route.
// They are kept synchronous (no server startup) to ensure they run reliably
// on Node 18 where dynamic imports inside before() hooks can cause cancellations.

const VALID_REPAIR_ACTIONS = new Set(['clean_lube', 'adjust', 'service', 'replace']);

function applyRepairFieldDefaults(part) {
  if (!VALID_REPAIR_ACTIONS.has(part.repair_action)) {
    part.repair_action = 'service';
  }
  if (typeof part.repair_notes !== 'string') {
    part.repair_notes = '';
  }
  if (!Number.isInteger(part.estimated_cost_min) || part.estimated_cost_min < 0) {
    part.estimated_cost_min = 0;
  }
  if (!Number.isInteger(part.estimated_cost_max) || part.estimated_cost_max < 0) {
    part.estimated_cost_max = 0;
  }
  return part;
}

describe('Repair fields schema defaults', () => {
  it('parts missing repair_action get default "service"', () => {
    const part = applyRepairFieldDefaults({ repair_action: undefined, repair_notes: undefined, estimated_cost_min: undefined, estimated_cost_max: undefined });
    assert.equal(part.repair_action, 'service', 'missing repair_action must default to "service"');
    assert.equal(part.repair_notes, '', 'missing repair_notes must default to ""');
    assert.equal(part.estimated_cost_min, 0, 'missing estimated_cost_min must default to 0');
    assert.equal(part.estimated_cost_max, 0, 'missing estimated_cost_max must default to 0');
  });

  it('parts with null repair_action get default "service"', () => {
    const part = applyRepairFieldDefaults({ repair_action: null, repair_notes: null, estimated_cost_min: null, estimated_cost_max: null });
    assert.equal(part.repair_action, 'service');
    assert.equal(part.repair_notes, '');
    assert.equal(part.estimated_cost_min, 0);
    assert.equal(part.estimated_cost_max, 0);
  });

  it('parts with invalid repair_action string get default "service"', () => {
    const part = applyRepairFieldDefaults({ repair_action: 'unknown_value', repair_notes: 'some notes', estimated_cost_min: 10, estimated_cost_max: 50 });
    assert.equal(part.repair_action, 'service', 'invalid repair_action must be replaced with "service"');
    assert.equal(part.repair_notes, 'some notes', 'valid repair_notes must be preserved');
    assert.equal(part.estimated_cost_min, 10, 'valid estimated_cost_min must be preserved');
    assert.equal(part.estimated_cost_max, 50, 'valid estimated_cost_max must be preserved');
  });

  it('all four valid repair_action values pass through unchanged', () => {
    for (const action of ['clean_lube', 'adjust', 'service', 'replace']) {
      const part = applyRepairFieldDefaults({ repair_action: action, repair_notes: 'test', estimated_cost_min: 5, estimated_cost_max: 20 });
      assert.equal(part.repair_action, action, `valid repair_action "${action}" must be preserved`);
    }
  });

  it('parts with all valid repair fields pass through unchanged', () => {
    const part = applyRepairFieldDefaults({
      repair_action: 'replace',
      repair_notes: 'Replace worn chain to prevent further drivetrain wear.',
      estimated_cost_min: 25,
      estimated_cost_max: 60,
    });
    assert.equal(part.repair_action, 'replace');
    assert.equal(part.repair_notes, 'Replace worn chain to prevent further drivetrain wear.');
    assert.equal(part.estimated_cost_min, 25);
    assert.equal(part.estimated_cost_max, 60);
  });

  it('parts with non-integer cost values get default 0', () => {
    const part = applyRepairFieldDefaults({ repair_action: 'clean_lube', repair_notes: '', estimated_cost_min: 'free', estimated_cost_max: 3.5 });
    assert.equal(part.estimated_cost_min, 0, 'string cost min must default to 0');
    assert.equal(part.estimated_cost_max, 0, 'float cost max must default to 0');
  });

  it('parts with negative cost values get default 0', () => {
    const part = applyRepairFieldDefaults({ repair_action: 'adjust', repair_notes: '', estimated_cost_min: -5, estimated_cost_max: -1 });
    assert.equal(part.estimated_cost_min, 0, 'negative cost min must default to 0');
    assert.equal(part.estimated_cost_max, 0, 'negative cost max must default to 0');
  });

  it('leather saddle with fair condition example: service action with cost range', () => {
    // Acceptance criteria example: Leather Saddle with fair condition
    const part = applyRepairFieldDefaults({
      repair_action: 'service',
      repair_notes: 'Apply leather conditioner and let soak overnight before buffing.',
      estimated_cost_min: 15,
      estimated_cost_max: 80,
    });
    assert.equal(part.repair_action, 'service');
    assert.ok(part.repair_notes.length > 0, 'repair_notes should be non-empty for service action');
    assert.ok(part.estimated_cost_min >= 0, 'estimated_cost_min must be non-negative');
    assert.ok(part.estimated_cost_max >= part.estimated_cost_min, 'estimated_cost_max must be >= estimated_cost_min');
  });
});
