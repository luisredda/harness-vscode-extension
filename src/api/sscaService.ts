import { HarnessClient } from './harnessClient';
import { SscaSbom } from './types';

export async function getSscaSbom(
  client: HarnessClient,
  planExecutionId: string
): Promise<SscaSbom> {
  const data = await client.get<{ data?: SscaSbom }>(
    '/ssca/api/v1/sbom',
    { executionId: planExecutionId }
  );
  return data?.data ?? {};
}
