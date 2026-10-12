const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMilestonePlan, calculateMilestoneTotal, validateMilestonePlan } = require('../lib/utils/milestones.js');

test('buildMilestonePlan creates a three-milestone plan and preserves the total amount', () => {
  const analysis = {
    amounts: [
      { amount: '$3,000.00', payment_for: 'Development', full_amount: '$3,000.00' },
      { amount: '$0.00', payment_for: 'Unused', full_amount: '$0.00' },
    ],
    tasks: [
      { task_description: 'Discovery', due_date: '2026-10-01', responsible_party: 'Client', additional_details: 'Scope and planning' },
      { task_description: 'Build', due_date: '2026-10-05', responsible_party: 'Contractor', additional_details: 'Implementation' },
      { task_description: 'Review', due_date: '2026-10-10', responsible_party: 'Client', additional_details: 'QA and handoff' },
    ],
  };

  const milestones = buildMilestonePlan(analysis);

  assert.equal(milestones.length, 3);
  assert.equal(calculateMilestoneTotal(milestones), 3000);
  assert.equal(validateMilestonePlan(milestones, 3000), true);
  assert.equal(milestones[0].title, 'Milestone 1');
  assert.equal(milestones[2].title, 'Milestone 3');
});

test('validateMilestonePlan rejects a split that does not match the agreement total', () => {
  const milestones = [
    { id: '1', title: 'Milestone 1', amount: 1000, status: 'PENDING' },
    { id: '2', title: 'Milestone 2', amount: 1000, status: 'PENDING' },
    { id: '3', title: 'Milestone 3', amount: 500, status: 'PENDING' },
  ];

  assert.equal(validateMilestonePlan(milestones, 3000), false);
  assert.equal(validateMilestonePlan(milestones, 2500), true);
});
