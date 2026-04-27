import { HarnessClient } from './harnessClient';
import { HarnessConfig } from '../config/configManager';
import { AidaRca } from './types';

export async function getAidaRca(
  client: HarnessClient,
  config: HarnessConfig,
  planExecutionId: string,
  stageId: string
): Promise<AidaRca> {
  const data = await client.post<{ data?: AidaRca }>(
    '/aida/api/v1/root-cause-analysis',
    {
      planExecutionId,
      stageId,
      accountId: config.accountIdentifier,
    }
  );
  return data?.data ?? {};
}
