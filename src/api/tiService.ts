import { HarnessClient } from './harnessClient';
import { HarnessConfig } from '../config/configManager';
import { TiOverview, TiFlakyTest } from './types';

export async function getTiOverview(
  client: HarnessClient,
  planExecutionId: string
): Promise<TiOverview> {
  const data = await client.get<{ data?: TiOverview }>(
    '/ti-service/tests/overview',
    { executionId: planExecutionId }
  );
  return data?.data ?? { total: 0, failed: 0, passed: 0, skipped: 0 };
}

export async function getFlakyTests(
  client: HarnessClient,
  config: HarnessConfig
): Promise<TiFlakyTest[]> {
  const data = await client.get<{ data?: TiFlakyTest[] }>(
    '/ti-service/tests/flaky',
    { accountId: config.accountIdentifier }
  );
  return data?.data ?? [];
}
