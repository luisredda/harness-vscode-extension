// Prompt builder for AI tools - constructs contextual prompts with pipeline execution data

interface ExecutionContext {
  pipelineIdentifier?: string;
  planExecutionId?: string;
  accountId?: string;
  org?: string;
  project?: string;
  baseUrl?: string;
}

/**
 * Build a contextual prompt for AI tools
 * Includes pipeline execution data, error context, and user question
 */
export function buildPrompt(userQuestion: string, context?: ExecutionContext): string {
  const parts: string[] = [];

  // If no context provided, return just the question
  if (!context) {
    return userQuestion;
  }

  // Build Harness URL if we have all required info
  if (context.baseUrl && context.accountId && context.org && context.project && context.pipelineIdentifier && context.planExecutionId) {
    const executionUrl = `${context.baseUrl}/ng/account/${context.accountId}/module/ci/orgs/${context.org}/projects/${context.project}/pipelines/${context.pipelineIdentifier}/executions/${context.planExecutionId}/pipeline`;

    // Start with the FIRST action - calling harness_get immediately
    parts.push(`Call harness_get with this Harness execution URL to get the full execution details:\n${executionUrl}`);
    parts.push(`\nThen use that data to answer this question: ${userQuestion}`);
    parts.push(`\nDo NOT ask for more information - the URL above has everything you need.`);
  } else if (context.planExecutionId) {
    parts.push(`Call harness_get with resourceType='execution' and executionId='${context.planExecutionId}' (org='${context.org}', project='${context.project}') to get the execution details.`);
    parts.push(`\nThen answer this question: ${userQuestion}`);
  } else {
    return userQuestion;
  }

  return parts.join('\n');
}
