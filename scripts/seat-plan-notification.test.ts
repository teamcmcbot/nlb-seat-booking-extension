import { describe, it, expect } from 'vitest';
// @ts-expect-error Maintenance CLI module.
import { notificationPayload } from './seat-plan-notification.mjs';
const env = { GITHUB_SERVER_URL: 'https://github.com', GITHUB_REPOSITORY: 'teamcmcbot/nlb-seat-booking-extension', GITHUB_RUN_ID: '123' };
const clean = { status: 'clean', generatedAt: '2026-09-13T16:05:00Z', summary: { total: 0, breaking: 0, review: 0, enrichment: 0 }, observed: { branches: 22, areas: 81, seats: 2030 } };
describe('audit notifications', () => {
  it('uses Singapore date and requested clean summary', () => {
    const p = notificationPayload(clean, 'success', env);
    expect(p.title).toBe('NLB Seat Audit (2026-09-14)');
    expect(p.message).toContain('0 changes: 0 breaking, 0 review, 0 baseline enrichment.');
    expect(p.message).toContain('No catalog or map drift detected.');
    expect(p.message).toContain('Seats: 2030');
    expect(p.url).toBe('https://github.com/teamcmcbot/nlb-seat-booking-extension/actions/runs/123');
    expect(p.dedupeKey).toBeUndefined();
  });
  it('does not describe missing evidence as clean', () => {
    expect(notificationPayload(null, 'failure', env).message).toContain('unavailable');
  });
  it('distinguishes incomplete evidence from clean zero drift', () => {
    expect(notificationPayload({ ...clean, status: 'incomplete' }, 'failure', env).message).toContain('incomplete');
  });
  it('preserves clean result but flags packaging failure', () => {
    expect(notificationPayload(clean, 'failure', env).message).toContain('packaging/upload');
  });
  it('reports drift severity counts', () => {
    expect(notificationPayload({ ...clean, status: 'drift', summary: { total: 3, breaking: 1, review: 2, enrichment: 0 } }, 'failure', env).message).toContain('3 changes: 1 breaking, 2 review');
  });
});
