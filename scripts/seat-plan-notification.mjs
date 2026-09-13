export function notificationPayload(data, jobResult, env, now = new Date()) {
  const valid = data && ['clean', 'drift', 'incomplete'].includes(data.status) &&
    ['total', 'breaking', 'review', 'enrichment'].every(k => Number.isSafeInteger(data.summary?.[k]) && data.summary[k] >= 0) &&
    ['branches', 'areas', 'seats'].every(k => Number.isSafeInteger(data.observed?.[k]) && data.observed[k] >= 0);
  const date = new Date(valid ? data.generatedAt : now);
  const dateText = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).format(Number.isNaN(date.valueOf()) ? now : date);
  const url = `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
  let message = 'Drift summary\n\n';
  if (valid) {
    const s = data.summary;
    message += `${s.total} changes: ${s.breaking} breaking, ${s.review} review, ${s.enrichment} baseline enrichment.\n\n`;
    message += data.status === 'clean' ? 'No catalog or map drift detected.' : data.status === 'incomplete' ? 'Audit evidence is incomplete; review the report.' : 'Catalog or map drift detected; review the report.';
    message += `\n\nBranches: ${data.observed.branches}\nAreas: ${data.observed.areas}\nSeats: ${data.observed.seats}`;
    if (jobResult !== 'success' && data.status === 'clean') message += '\n\nWarning: audit job failed after collection; check report packaging/upload.';
  } else message += `Audit ${jobResult || 'failed'}; no complete report is available. Drift and catalog counts are unavailable.`;
  return { source: 'github-actions', eventType: 'workflow.completed', title: `NLB Seat Audit (${dateText})`, message, priority: 0, sound: 'pushover', url, urlTitle: 'View workflow run', timestamp: Math.floor(now.valueOf()/1000), html: false, monospace: false,
    metadata: { repo: env.GITHUB_REPOSITORY, workflow: env.GITHUB_WORKFLOW, runId: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT } };
}
