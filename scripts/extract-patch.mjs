#!/usr/bin/env node
/**
 * Regenerates a DSH host patch from a deepseek-harness checkout that
 * contains both the pinned baseline snapshot and the upstream commit
 * carrying the host wiring (typically a fork branch).
 *
 * Contract (patches/README.md): a host patch carries only the actual code
 * the official plugin registration system cannot provide — launcher
 * wiring, build seams, catalog entries compiled into official packages,
 * and their tests. Never documentation, never anything the official
 * channels handle (bundle roster and dependencies, workspace integration,
 * generation, install-side artifacts). This script reproduces the trimmed
 * diff mechanically:
 *   - create a worktree at the upstream commit;
 *   - revert the configured files to the baseline snapshot;
 *   - re-apply the configured seam edits (partial keeps);
 *   - diff baseline..worktree excluding the configured paths;
 *   - verify forward apply on a baseline worktree and reverse apply on
 *     the trimmed worktree.
 *
 * Configuration lives in `patches/host-patch.config.json` (schema in
 * patches/README.md). CLI flags override the config:
 *   --harness <path>  checkout containing both snapshots
 *                     (default $DSH_HARNESS or ../deepseek-harness)
 *   --baseline <sha>  pinned host snapshot
 *   --upstream <ref>  upstream commit carrying the wiring
 *   --out <path>      patch output path
 *   --config <path>   config file (default patches/host-patch.config.json)
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function git(harness, args, cwd) {
  return execFileSync('git', ['-C', harness, ...args], { cwd, encoding: 'utf8' })
}

function parseArgs(argv) {
  const args = {
    harness: process.env.DSH_HARNESS ?? resolve(REPO_ROOT, '../deepseek-harness'),
    baseline: undefined, upstream: undefined, out: undefined,
    config: join(REPO_ROOT, 'patches/host-patch.config.json'),
  }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--harness') args.harness = resolve(argv[++i])
    else if (argv[i] === '--baseline') args.baseline = argv[++i]
    else if (argv[i] === '--upstream') args.upstream = argv[++i]
    else if (argv[i] === '--out') args.out = resolve(argv[++i])
    else if (argv[i] === '--config') args.config = resolve(argv[++i])
    else throw new Error(`unknown argument: ${argv[i]}`)
  }
  return args
}

const args = parseArgs(process.argv.slice(2))
const config = existsSync(args.config)
  ? JSON.parse(await readFile(args.config, 'utf8'))
  : { baseline: undefined, upstream: undefined, out: undefined, exclude: [], revert: [], seams: [] }

const baseline = args.baseline ?? config.baseline
const upstream = args.upstream ?? config.upstream
const out = args.out ?? (config.out ? resolve(REPO_ROOT, config.out) : undefined)
if (!baseline || !upstream || !out) {
  throw new Error('baseline, upstream, and out are required (CLI flags or patches/host-patch.config.json)')
}
if (!existsSync(args.config)) {
  console.log(`note: no ${args.config} — plain diff, no reverts, no seams`)
}

for (const ref of [baseline, upstream]) {
  try {
    git(args.harness, ['rev-parse', '--verify', `${ref}^{commit}`])
  } catch {
    throw new Error(`commit ${ref} not found in ${args.harness} — pass --harness <fork checkout> containing both snapshots`)
  }
}

const excludes = (config.exclude ?? []).map(entry =>
  entry.startsWith(':(') ? entry : `:(exclude)${entry}`)

const worktrees = []
try {
  const trimmed = await mkdtemp(join(tmpdir(), 'dsh-extract-trimmed-'))
  const baselineTree = await mkdtemp(join(tmpdir(), 'dsh-extract-baseline-'))
  worktrees.push(trimmed, baselineTree)

  git(args.harness, ['worktree', 'add', '--detach', trimmed, upstream])
  git(args.harness, ['worktree', 'add', '--detach', baselineTree, baseline])

  // Revert registry-handled files to the baseline, then re-apply seam lines.
  const revert = config.revert ?? []
  const seams = config.seams ?? []
  if (revert.length > 0) {
    git(args.harness, ['-C', trimmed, 'checkout', baseline, '--', ...revert, ...seams.map(s => s.file)])
  }
  for (const seam of seams) {
    const path = join(trimmed, seam.file)
    const content = await readFile(path, 'utf8')
    if (!content.includes(seam.old)) {
      throw new Error(`seam anchor not found in ${seam.file} — upstream layout drifted, update the config`)
    }
    await writeFile(path, content.replace(seam.old, seam.new))
  }

  // baseline..trimmed minus the excluded paths.
  const patch = git(args.harness, ['-C', trimmed, 'diff', baseline, '--', '.', ...excludes])
  if (!patch.trim()) throw new Error('empty patch — nothing changed between baseline and upstream outside the excluded paths')

  // Verify: forward apply on a baseline tree, reverse apply on the trimmed tree.
  await writeFile(out, patch)
  execFileSync('git', ['-C', baselineTree, 'apply', '--check', out], { encoding: 'utf8' })
  execFileSync('git', ['-C', trimmed, 'apply', '--check', '-R', out], { encoding: 'utf8' })

  const files = patch.split('\n').filter(line => line.startsWith('diff --git ')).length
  console.log(`wrote ${out}: ${files} files, ${patch.split('\n').length - 1} lines`)
  console.log(`verified: forward apply @ ${baseline}, reverse apply on trimmed tree`)
} finally {
  for (const worktree of worktrees) {
    try { git(args.harness, ['worktree', 'remove', '--force', worktree]) } catch { /* already gone */ }
  }
}
