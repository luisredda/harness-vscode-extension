import { HarnessClient } from './harnessClient';
import { PolicyEvaluation } from './types';

export async function getPolicyEvaluation(
  client: HarnessClient,
  planExecutionId: string
): Promise<PolicyEvaluation> {
  const data = await client.get<{ data?: PolicyEvaluation }>(
    `/pipeline/api/pipelines/execution/${planExecutionId}/policy-evaluation`
  );
  return data?.data ?? { status: 'UNKNOWN' };
}
