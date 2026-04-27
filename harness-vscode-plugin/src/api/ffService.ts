import { HarnessClient } from './harnessClient';
import { HarnessConfig } from '../config/configManager';
import { FlagState } from './types';

export async function getFlagState(
  client: HarnessClient,
  config: HarnessConfig,
  flagKey: string
): Promise<FlagState> {
  const data = await client.get<{ data?: FlagState }>(
    `/cf/admin/features/${flagKey}`,
    {
      accountIdentifier: config.accountIdentifier,
      projectIdentifier: config.projectIdentifier,
    }
  );
  return data?.data ?? {
    key: flagKey,
    name: flagKey,
    enabled: false,
    environments: [],
  };
}
