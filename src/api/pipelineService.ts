import { HarnessClient } from './harnessClient';
import { HarnessConfig } from '../config/configManager';

export interface PipelineListItem {
  identifier: string;
  name: string;
  description?: string;
  tags?: Record<string, string>;
  version?: number;
  gitDetails?: {
    branch?: string;
    repoName?: string;
    filePath?: string;
  };
  executionSummaryInfo?: {
    lastExecutionStatus?: string;
    lastExecutionTs?: number;
    deployments?: any[];
    numOfErrors?: number[];
  };
  recentExecutionsInfo?: Array<{
    planExecutionId?: string;
    status?: string;
    startTs?: number;
    endTs?: number;
  }>;
  storeType?: string;
  connectorRef?: string;
}

export interface PipelineListResponse {
  status: string;
  data: {
    pipelines?: PipelineListItem[];
    content?: PipelineListItem[];
  };
}

export async function getPipelineList(
  client: HarnessClient,
  config: HarnessConfig
): Promise<PipelineListItem[]> {
  const response = await client.post<PipelineListResponse>(
    '/pipeline/api/pipelines/list',
    { filterType: 'PipelineSetup' },
    {
      accountIdentifier: config.accountIdentifier,
      orgIdentifier: config.orgIdentifier,
      projectIdentifier: config.projectIdentifier,
      page: '0',
      size: '100',
    }
  );

  // API returns pipelines in data.pipelines or data.content depending on version
  return response.data?.pipelines ?? response.data?.content ?? [];
}
