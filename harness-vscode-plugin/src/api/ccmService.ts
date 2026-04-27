import { HarnessClient } from './harnessClient';
import { BuildCost } from './types';

export async function getBuildCost(
  client: HarnessClient,
  planExecutionId: string
): Promise<BuildCost> {
  const data = await client.get<{ data?: BuildCost }>(
    '/ccm/api/v1/execution-cost',
    { executionId: planExecutionId }
  );
  return data?.data ?? {};
}
