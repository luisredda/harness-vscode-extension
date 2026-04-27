// AI tool launcher - spawns Claude Code CLI or opens Extension

import { spawn } from 'child_process';
import * as vscode from 'vscode';
import * as os from 'os';

export interface LaunchResult {
  type: 'response' | 'launched' | 'error';
  content?: string;
  toolCalls?: Array<{ name: string; args?: unknown }>;
  durationMs?: number;
  error?: string;
}

interface LaunchOptions {
  prompt: string;
  toolId: 'claudecode-cli' | 'claudecode-ext';
  timeout?: number; // milliseconds, default 60000
  cwd?: string; // working directory for CLI execution
}

/**
 * Launch AI tool with the given prompt
 */
export async function launchAI(options: LaunchOptions): Promise<LaunchResult> {
  if (options.toolId === 'claudecode-cli') {
    return launchCLI(options.prompt, options.timeout, options.cwd);
  } else {
    return launchExtension(options.prompt);
  }
}

/**
 * Launch Claude Code CLI subprocess
 * Runs: claude "<prompt>" --output-format json
 */
async function launchCLI(prompt: string, timeout = 60000, cwd?: string): Promise<LaunchResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let output = '';
    let errorOutput = '';

    // Spawn claude CLI process
    // Use --bare mode to skip all automatic context loading (hooks, LSP, CLAUDE.md, local files)
    // Use --permission-mode bypassPermissions so MCP servers don't require interactive approval
    // Explicitly load MCP config from ~/.claude.json (bare mode needs this)
    // Run from a temp directory to avoid any directory-based context
    const runDir = os.tmpdir();
    const claudeConfigPath = `${os.homedir()}/.claude.json`;
    const proc = spawn('claude', [
      prompt,
      '--output-format', 'json',
      '--permission-mode', 'bypassPermissions',
      '--bare',  // Skip hooks, LSP, plugin sync, auto-memory, CLAUDE.md discovery
      '--mcp-config', claudeConfigPath,  // Explicitly load MCP servers from global config
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout,
      cwd: runDir,
      env: {
        ...process.env,
        CLAUDE_CODE_SIMPLE: '1',  // Reinforces bare mode
      },
    });

    // Collect stdout
    proc.stdout?.on('data', (data: Buffer) => {
      output += data.toString();
    });

    // Collect stderr
    proc.stderr?.on('data', (data: Buffer) => {
      errorOutput += data.toString();
    });

    // Handle timeout
    const timeoutId = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({
        type: 'error',
        error: `Request timed out after ${timeout / 1000} seconds`,
      });
    }, timeout);

    // Handle process completion
    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      if (code !== 0) {
        resolve({
          type: 'error',
          error: errorOutput || `Process exited with code ${code}`,
          durationMs,
        });
        return;
      }

      // Parse JSON output
      try {
        const result = JSON.parse(output);

        // Extract response content from Claude CLI JSON format
        // Claude CLI returns: { type: "result", result: "actual content here", ... }
        const content = result.result || result.content || result.message || output;
        const toolCalls = extractToolCalls(result);

        resolve({
          type: 'response',
          content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
          toolCalls,
          durationMs,
        });
      } catch (error) {
        // Fallback to raw output if JSON parsing fails
        resolve({
          type: 'response',
          content: output || 'No response received',
          durationMs,
        });
      }
    });

    // Handle process errors
    proc.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        type: 'error',
        error: `Failed to launch Claude CLI: ${error.message}`,
      });
    });
  });
}

/**
 * Launch Claude Code Extension
 * Opens the extension and copies prompt to clipboard
 */
async function launchExtension(prompt: string): Promise<LaunchResult> {
  try {
    console.log('[AI Launcher] Starting Extension integration');
    console.log('[AI Launcher] Prompt length:', prompt.length);

    // Try to execute Claude Code extension command
    const extension = vscode.extensions.getExtension('anthropic.claude-code');
    if (!extension) {
      console.log('[AI Launcher] ✗ Extension not found');
      return {
        type: 'error',
        error: 'Claude Code extension not found',
      };
    }

    console.log('[AI Launcher] ✓ Extension found');
    console.log('[AI Launcher]   Extension ID:', extension.id);
    console.log('[AI Launcher]   Is Active:', extension.isActive);

    // Activate extension if not already active
    if (!extension.isActive) {
      console.log('[AI Launcher] ⏳ Activating extension...');
      await extension.activate();
      console.log('[AI Launcher] ✓ Extension activated');
    }

    // List all available Claude Code commands first
    const allCommands = await vscode.commands.getCommands(true);
    const claudeCommands = allCommands.filter(cmd =>
      cmd.toLowerCase().includes('claude') || cmd.toLowerCase().includes('anthropic')
    );
    console.log('[AI Launcher] Available Claude/Anthropic commands:', claudeCommands);

    // Open Claude Code chat interface
    console.log('[AI Launcher] ⏳ Opening Claude Code chat...');

    // Try these commands in order of preference
    const openCommands = [
      'claude-vscode.focus',           // Focus the main Claude view
      'claudeVSCodeSidebar.focus',     // Focus the sidebar view
      'claude-vscode.sidebar.open',    // Open sidebar
      'claudeVSCodeSidebar.open',      // Open the view
      'claude-vscode.window.open',     // Open as window/editor
    ];

    let opened = false;
    for (const cmd of openCommands) {
      if (claudeCommands.includes(cmd)) {
        console.log(`[AI Launcher] ⏳ Trying: ${cmd}`);
        try {
          await vscode.commands.executeCommand(cmd);
          console.log(`[AI Launcher] ✓ Opened with: ${cmd}`);
          // Give it time to fully render
          await new Promise(resolve => setTimeout(resolve, 600));
          opened = true;
          break;
        } catch (cmdErr) {
          console.log(`[AI Launcher] ⚠ ${cmd} failed:`, cmdErr);
        }
      } else {
        console.log(`[AI Launcher] ⊘ ${cmd} not available`);
      }
    }

    if (!opened) {
      console.log('[AI Launcher] ✗ Could not open Claude Code with any command');
      vscode.window.showWarningMessage('Could not open Claude Code. Please open it manually and try again.');
      return {
        type: 'error',
        error: 'Failed to open Claude Code',
      };
    }

    // Try starting a new conversation (opens with empty input ready)
    if (claudeCommands.includes('claude-vscode.newConversation')) {
      console.log('[AI Launcher] ⏳ Starting new conversation...');
      try {
        await vscode.commands.executeCommand('claude-vscode.newConversation');
        console.log('[AI Launcher] ✓ New conversation started');
        // Give the input time to focus and render
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err) {
        console.log('[AI Launcher] ⚠ New conversation failed:', err);
      }
    } else {
      console.log('[AI Launcher] ⚠ newConversation command not available');
    }

    // Copy prompt to clipboard
    console.log('[AI Launcher] ⏳ Copying prompt to clipboard...');
    await vscode.env.clipboard.writeText(prompt);
    console.log('[AI Launcher] ✓ Prompt copied');

    // Show notification with paste button
    const action = await vscode.window.showInformationMessage(
      'Prompt copied! Paste it in Claude Code to continue.',
      'Paste Now'
    );

    if (action === 'Paste Now') {
      console.log('[AI Launcher] User clicked Paste Now - sending paste command');
      // Try to paste in the Claude input (this might not work if focus is wrong)
      try {
        await vscode.commands.executeCommand('editor.action.clipboardPasteAction');
        console.log('[AI Launcher] ✓ Paste command sent');
      } catch (err) {
        console.log('[AI Launcher] ⚠ Paste command failed:', err);
      }
    }

    console.log('[AI Launcher] ✓ Extension launch complete');
    return {
      type: 'launched',
      content: 'Opened Claude Code Extension. Prompt ready to paste.',
    };
  } catch (error) {
    console.error('[AI Launcher] ✗ Extension launch failed:', error);
    return {
      type: 'error',
      error: error instanceof Error ? error.message : 'Failed to launch extension',
    };
  }
}

/**
 * Extract tool calls from Claude CLI JSON response
 * CLI returns structure like: { content: "...", tool_use: [...] }
 */
function extractToolCalls(result: unknown): Array<{ name: string; args?: unknown }> | undefined {
  if (!result || typeof result !== 'object') {
    return undefined;
  }

  const obj = result as Record<string, unknown>;

  // Check for tool_use array
  if (Array.isArray(obj.tool_use)) {
    return obj.tool_use.map((tool: unknown) => {
      if (tool && typeof tool === 'object') {
        const t = tool as Record<string, unknown>;
        return {
          name: typeof t.name === 'string' ? t.name : 'unknown',
          args: t.input,
        };
      }
      return { name: 'unknown' };
    });
  }

  // Check for content blocks with tool_use type
  if (Array.isArray(obj.content)) {
    const toolUseBlocks = obj.content.filter(
      (block: unknown) =>
        block &&
        typeof block === 'object' &&
        (block as Record<string, unknown>).type === 'tool_use'
    );

    if (toolUseBlocks.length > 0) {
      return toolUseBlocks.map((block: unknown) => {
        const b = block as Record<string, unknown>;
        return {
          name: typeof b.name === 'string' ? b.name : 'unknown',
          args: b.input,
        };
      });
    }
  }

  return undefined;
}
