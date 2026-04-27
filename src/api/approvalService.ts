import { HarnessConfig } from '../config/configManager';

export async function submitApproval(
  config: HarnessConfig,
  planExecutionId: string,
  action: 'APPROVE' | 'REJECT',
  comments?: string
): Promise<void> {
  const url = `${config.baseUrl}/gateway/pipeline/api/v1/orgs/${encodeURIComponent(config.orgIdentifier)}/projects/${encodeURIComponent(config.projectIdentifier)}/approvals/execution/${encodeURIComponent(planExecutionId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Harness-Account': config.accountIdentifier,
      'x-api-key': config.apiKey,
    },
    body: JSON.stringify({ action, comments: comments ?? '', approver_inputs: [] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
}
