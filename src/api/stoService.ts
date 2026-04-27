import { HarnessClient } from './harnessClient';
import { StoFinding } from './types';

export async function getStoFindings(
  client: HarnessClient,
  planExecutionId: string
): Promise<StoFinding[]> {
  const data = await client.get<{ data?: { content?: StoFinding[] } }>(
    '/sto/api/v1/issues',
    { executionId: planExecutionId }
  );
  return data?.data?.content ?? [];
}
