#!/usr/bin/env node
/**
 * Cursor afterFileEdit hook — updates AGENTS.md timestamp and recent-edits log.
 * Skips edits to AGENTS.md itself and hook files to avoid loops.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const AGENTS_FILE = 'AGENTS.md'
const MAX_RECENT_EDITS = 30

const SKIP_PATTERNS = [
  /^AGENTS\.md$/i,
  /^agent\.md$/i,
  /^\.cursor\/hooks\//,
  /^node_modules\//,
  /^dist\//,
  /^\.git\//,
  /^\._/,
  /^package-lock\.json$/,
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

function extractFilePath(input) {
  const candidates = [
    input.file_path,
    input.filePath,
    input.path,
    input.file,
    input.editedFile,
    input.edits?.[0]?.path,
    input.edits?.[0]?.file,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }

  return null
}

function shouldSkip(relativePath) {
  return SKIP_PATTERNS.some((pattern) => pattern.test(relativePath))
}

function formatTimestamp(date = new Date()) {
  return date.toISOString().replace('T', ' ').slice(0, 16)
}

function replaceSection(content, markerName, newInner) {
  const start = `<!-- AUTO:${markerName} -->`
  const end = `<!-- /AUTO:${markerName} -->`
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`)
  const replacement = `${start}\n${newInner}\n${end}`

  if (!regex.test(content)) {
    return null
  }

  return content.replace(regex, replacement)
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

  const filePath = extractFilePath(input)
  if (!filePath) {
    process.exit(0)
  }

  const projectRoot = process.cwd()
  const absolutePath = resolve(projectRoot, filePath)
  const relativePath = relative(projectRoot, absolutePath).replace(/\\/g, '/')

  if (shouldSkip(relativePath)) {
    process.exit(0)
  }

  const agentsPath = resolve(projectRoot, AGENTS_FILE)
  let content

  try {
    content = readFileSync(agentsPath, 'utf8')
  } catch {
    process.stderr.write(`AGENTS.md not found at ${agentsPath}\n`)
    process.exit(0)
  }

  const timestamp = formatTimestamp()
  const editLine = `- \`${timestamp}\` — \`${relativePath}\``

  let updated = replaceSection(
    content,
    'LAST_UPDATED',
    `**Last updated:** ${timestamp} (auto)`,
  )

  if (!updated) {
    process.exit(0)
  }

  const recentMatch = updated.match(
    /<!-- AUTO:RECENT_EDITS -->([\s\S]*?)<!-- \/AUTO:RECENT_EDITS -->/,
  )

  if (recentMatch) {
    const existingLines = recentMatch[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))

    const nextLines = [editLine, ...existingLines.filter((line) => line !== editLine)]
      .slice(0, MAX_RECENT_EDITS)
      .join('\n')

    updated = replaceSection(updated, 'RECENT_EDITS', nextLines) ?? updated
  }

  writeFileSync(agentsPath, updated, 'utf8')
  process.exit(0)
}

main().catch(() => process.exit(0))
