// Thin adapter that runs one judgement through the `claude` CLI in headless
// print mode (issue #100). The CLI reads ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN
// from the environment, which keeps the model provider swappable at deploy time
// with no code change. The prompt is written to stdin (never argv) so a long or
// odd submission can't overflow the command line, and the untrusted submission
// text stays fenced by buildJudgementPrompt.

import { spawn } from 'node:child_process';
import { buildJudgementPrompt } from './prompt.mjs';
import { parseVerdict } from './verdict.mjs';

/**
 * Spawn the CLI, feed the prompt on stdin, collect stdout.
 * @param {string} prompt
 * @param {{ bin?: string, args?: string[] }} [opts]
 * @returns {Promise<string>}
 */
function runClaude(prompt, opts = {}) {
  const bin = opts.bin || 'claude';
  const args = opts.args || ['-p', '--output-format', 'text'];
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`claude exited ${code}: ${err.trim() || out.trim()}`));
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

/**
 * Judge one submission. Returns a parsed, fail-closed verdict.
 * @param {{id:string,input:string}} submission
 * @param {object} [opts] - forwarded to runClaude (bin/args), for tests
 */
export async function judge(submission, opts = {}) {
  const prompt = buildJudgementPrompt(submission);
  const output = await runClaude(prompt, opts);
  return parseVerdict(output);
}

export { runClaude };
