import { execFileSync } from 'node:child_process';
import { notificationPayload } from './seat-plan-notification.mjs';
try {
  if (!process.env.SEND_NOTIFICATION_SSM_PARAM || !process.env.AWS_REGION) throw new Error('configuration');
  const key = execFileSync('aws', ['ssm', 'get-parameter', '--name', process.env.SEND_NOTIFICATION_SSM_PARAM, '--with-decryption', '--region', process.env.AWS_REGION, '--query', 'Parameter.Value', '--output', 'text'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 }).trim();
  if (!key || key === 'None') throw new Error('empty key');
  console.log(`::add-mask::${key.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A')}`);
  let data;
  try { data = JSON.parse(process.env.AUDIT_DATA || 'null'); } catch { data = null; }
  const payload = notificationPayload(data, process.env.AUDIT_JOB_RESULT, process.env);
  const response = await fetch('https://api.zhenwei.dev/send-notification', {
    method: 'POST', redirect: 'error', headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error('HTTP failure');
  const result = await response.json();
  if (result.accepted !== true || result.provider !== 'pushover') throw new Error('not accepted');
  console.log('Audit notification accepted by Pushover.');
} catch {
  console.error('Audit notification failed. Check OIDC, SSM configuration, and notification service health. No automatic retry was made.');
  process.exitCode = 1;
}
