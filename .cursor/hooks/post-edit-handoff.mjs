#!/usr/bin/env node
/**
 * Cursor postToolUse hook — reminds the agent to update AGENTS.md substantively.
 */

import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const SKIP_PATTERNS = [
  /^AGENTS\.md$/i,
  /^agent\.md$/i,
  /^\.cursor\//,
  /^node_modules\//,
  /^dist\//,
  /^\._/,
]

function readStdin() {
  return new Promise((resolvePromise) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => resolvePromise(data))
    process.stdin.resume()
  })
}

function extractPaths(input) {
  const paths = new Set()
  const candidates = [
    input.path,
    input.file_path,
    input.filePath,
    input.file,
    input.target_notebook,
    input.arguments?.path,
    input.tool_input?.path,
    input.input?.path,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      paths.add(candidate)
    }
  }

  return [...paths]
}

function shouldSkip(relativePath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(relativePath))
}

async function main() {
  const raw = await readStdin()
  if (!raw.trim()) {
    process.exit(0)
  }

  let input
  try {
    input = JSON.parse(raw)
  } catch {
    process.exit(0)
  }

  const projectRoot = process.cwd()
  const editedPaths = extractPaths(input)
    .map((filePath) => relative(projectRoot, resolve(projectRoot, filePath)).replace(/\\/g, '/'))
    .filter((relativePath) => relativePath && !shouldSkip(relativePath))

  if (editedPaths.length === 0) {
    process.exit(0)
  }

  let agentsExists = false
  try {
    readFileSync(resolve(projectRoot, 'AGENTS.md'), 'utf8')
    agentsExists = true
  } catch {
    agentsExists = false
  }

  if (!agentsExists) {
    process.exit(0)
  }

  const fileList = editedPaths.map((p) => `\`${p}\``).join(', ')

  const payload = {
    additional_context: [
      'Agent handoff reminder: project files were edited.',
      `Edited: ${fileList}`,
      'Update AGENTS.md substantively if the change affects architecture, features, env vars, deployment, or pending work.',
      'The afterFileEdit hook already refreshed the Last updated timestamp and Recent edits log.',
    ].join(' '),
  }

  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

main().catch(() => process.exit(0))
