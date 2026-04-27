import { HarnessConfig } from '../config/configManager';

export async function rerunPipeline(
  config: HarnessConfig,
  pipelineIdentifier: string,
  planExecutionId: string
): Promise<{ planExecutionId: string }> {
  // Harness API endpoint for re-running a pipeline execution with original inputs (v2)
  const url = `${config.baseUrl}/pipeline/api/pipelines/execution/rerun/v2/${encodeURIComponent(planExecutionId)}/${encodeURIComponent(pipelineIdentifier)}?accountIdentifier=${encodeURIComponent(config.accountIdentifier)}&orgIdentifier=${encodeURIComponent(config.orgIdentifier)}&projectIdentifier=${encodeURIComponent(config.projectIdentifier)}&useOriginalPipelineYamlOnRerun=true`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/yaml',
      'x-api-key': config.apiKey,
    },
    body: '',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data?.data ?? data;
}
