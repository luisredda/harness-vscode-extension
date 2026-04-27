// AI tool detection for Claude Code CLI and Extension
// Checks PATH for CLI, VS Code extensions API for Extension, and MCP configuration readiness

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface DetectedTool {
  id: 'claudecode-cli' | 'claudecode-ext';
  name: string;
  sub: string | null;
  mcpReady: boolean;
  path?: string; // CLI executable path or extension install path
}

export interface DetectionResult {
  tools: DetectedTool[];
  activeTool: string | null; // ID of the highest-priority tool
  mcpConfigPath: string | null;
}

/**
 * Detect Claude Code CLI by checking PATH
 */
async function detectClaudeCLI(): Promise<DetectedTool | null> {
  try {
    // Check if claude command exists
    const command = process.platform === 'win32' ? 'where claude' : 'which claude';
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();

    if (!output) {
      return null;
    }

    const cliPath = output.split('\n')[0]; // Take first match

    // Verify it's Claude Code CLI by checking version
    try {
      const versionOutput = execSync('claude --version', { encoding: 'utf-8', stdio: 'pipe', timeout: 3000 });

      // Check if it's actually Claude Code (not some other claude command)
      if (!versionOutput.toLowerCase().includes('claude')) {
        return null;
      }
    } catch {
      // If --version fails, assume it's not Claude Code
      return null;
    }

    // Check MCP configuration readiness
    const mcpReady = await checkMCPReady();

    return {
      id: 'claudecode-cli',
      name: 'Claude Code',
      sub: 'CLI',
      mcpReady,
      path: cliPath,
    };
  } catch (error) {
    // Command not found or execution failed
    return null;
  }
}

/**
 * Detect Claude Code Extension via VS Code extensions API
 */
async function detectClaudeExtension(): Promise<DetectedTool | null> {
  try {
    const extension = vscode.extensions.getExtension('anthropic.claude-code');

    if (!extension) {
      return null;
    }

    // Check MCP configuration readiness (same config file as CLI)
    const mcpReady = await checkMCPReady();

    return {
      id: 'claudecode-ext',
      name: 'Claude Code',
      sub: 'Extension',
      mcpReady,
      path: extension.extensionPath,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if Harness MCP server is configured in Claude Desktop config
 */
async function checkMCPReady(): Promise<boolean> {
  const configPath = getClaudeConfigPath();

  if (!configPath || !fs.existsSync(configPath)) {
    return false;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Check if mcpServers.harness exists and has required fields
    const harnessServer = config?.mcpServers?.harness;
    if (!harnessServer) {
      return false;
    }

    // Verify it has command and env (at minimum)
    const hasCommand = typeof harnessServer.command === 'string' && harnessServer.command.length > 0;
    const hasEnv = harnessServer.env && typeof harnessServer.env === 'object';

    return hasCommand && hasEnv;
  } catch (error) {
    // Invalid JSON or read error
    return false;
  }
}

/**
 * Get Claude Code config path
 * Returns ~/.claude.json on all platforms
 */
function getClaudeConfigPath(): string {
  return path.join(os.homedir(), '.claude.json');
}

/**
 * Detect all available AI tools (Claude Code CLI + Extension)
 * Returns preferred tool as activeTool, or first available if no preference
 */
export async function detectAITools(preferredToolId?: string): Promise<DetectionResult> {
  const tools: DetectedTool[] = [];

  // Detect CLI
  const cli = await detectClaudeCLI();
  if (cli) {
    tools.push(cli);
  }

  // Detect Extension
  const ext = await detectClaudeExtension();
  if (ext) {
    tools.push(ext);
  }

  // Use preferred tool if specified and available, otherwise default to first
  let activeTool: string | null = null;
  if (preferredToolId && tools.some(t => t.id === preferredToolId)) {
    activeTool = preferredToolId;
  } else {
    activeTool = tools.length > 0 ? tools[0].id : null;
  }

  return {
    tools,
    activeTool,
    mcpConfigPath: tools.length > 0 ? getClaudeConfigPath() : null,
  };
}

/**
 * Get the MCP config path for Claude Code
 * Used by MCP configurer to write settings
 */
export function getMCPConfigPath(): string {
  return getClaudeConfigPath();
}
