function parseCurrencyAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value && value !== 0) {
    return 0;
  }

  const normalized = String(value)
    .replace(/[()]/g, '')
    .replace(/[$€£,\s]/g, '')
    .replace(/−/g, '-')
    .trim();

  const numericValue = Number.parseFloat(normalized);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function calculateMilestoneTotal(milestones) {
  if (!Array.isArray(milestones)) {
    return 0;
  }

  return milestones.reduce((total, milestone) => {
    const amount = Number(milestone?.amount ?? 0);
    return total + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

function buildMilestonePlan(analysis) {
  const amounts = Array.isArray(analysis?.amounts) ? analysis.amounts : [];
  const tasks = Array.isArray(analysis?.tasks) ? analysis.tasks : [];

  if (!amounts.length) {
    return [];
  }

  const amountEntries = amounts
    .map((entry, index) => {
      const amount = parseCurrencyAmount(entry?.amount ?? entry?.full_amount ?? entry?.payment_for ?? 0);
      const title = entry?.payment_for || tasks[index]?.task_description || `Milestone ${index + 1}`;

      return {
        id: `${index + 1}`,
        title,
        amount,
        status: 'PENDING',
        dueDate: tasks[index]?.due_date ?? null,
        description: tasks[index]?.task_description || entry?.payment_for || `Milestone ${index + 1}`,
        acceptanceCriteria: tasks[index]?.additional_details || 'Awaiting client approval',
      };
    })
    .filter((entry) => Number(entry.amount) > 0);

  if (!amountEntries.length) {
    return [];
  }

  const total = amountEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);
  const targetCount = 3;

  if (amountEntries.length >= targetCount) {
    return amountEntries.slice(0, targetCount).map((entry, index) => ({
      ...entry,
      title: entry.title || `Milestone ${index + 1}`,
      amount: Number(entry.amount),
      description: entry.description || `Milestone ${index + 1}`,
    }));
  }

  const perMilestone = Number((total / targetCount).toFixed(2));
  const plan = [];
  let runningTotal = 0;

  for (let index = 0; index < targetCount; index += 1) {
    const isLast = index === targetCount - 1;
    const amount = isLast ? Number((total - runningTotal).toFixed(2)) : perMilestone;
    const fallbackTask = tasks[index] || null;
    const milestone = {
      id: `${index + 1}`,
      title: `Milestone ${index + 1}`,
      amount,
      status: 'PENDING',
      dueDate: fallbackTask?.due_date ?? null,
      description: fallbackTask?.task_description || `Milestone ${index + 1}`,
      acceptanceCriteria: fallbackTask?.additional_details || 'Awaiting client approval',
    };

    plan.push(milestone);
    runningTotal += Number(milestone.amount);
  }

  return plan;
}

function validateMilestonePlan(milestones, expectedTotal) {
  if (!Array.isArray(milestones) || milestones.length !== 3) {
    return false;
  }

  const total = calculateMilestoneTotal(milestones);
  const expected = Number(expectedTotal ?? total);

  if (!Number.isFinite(expected) || expected <= 0) {
    return false;
  }

  return milestones.every((milestone) => Number(milestone?.amount ?? 0) > 0) &&
    Math.abs(total - expected) <= 0.01;
}

module.exports = {
  parseCurrencyAmount,
  calculateMilestoneTotal,
  buildMilestonePlan,
  validateMilestonePlan,
};
