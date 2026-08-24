import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
  name: string
  exports: Record<string, unknown>
  files: string[]
  peerDependencies: Record<string, string>
  scripts: Record<string, string>
  dsh: { bundle: { patch: string }, client: { platform: string, inject: string[] } }
}

describe('package composition', () => {
  it('declares the Web client and official bundle patch', () => {
    expect(manifest.name).toBe('@0xsline/dsh-spotlight')
    expect(manifest.exports['./client']).toBeDefined()
    expect(manifest.dsh.bundle.patch).toBe('./cordis.patch.yml')
    expect(manifest.dsh.client).toEqual({
      platform: 'web',
      inject: ['@deepseek-ai/dsh-client-runtime'],
    })
  })

  it('composes only package-owned rows', () => {
    const patch = readFileSync(new URL('cordis.patch.yml', root), 'utf8')
    expect(patch).toContain("id: dsh-spotlight\n      name: '@0xsline/dsh-spotlight'")
    expect(patch).not.toContain('dsh-spotlight-invariant')
  })

  it('keeps the distribution lifecycle explicit', () => {
    expect(manifest.scripts.prepare).toBe('node scripts/prepare.mjs')
    expect(manifest.files).toContain('lib/index.js')
    expect(manifest.peerDependencies).toHaveProperty('@deepseek-ai/schemastery')
    expect(manifest.peerDependencies).not.toHaveProperty('schemastery')

    const prepare = readFileSync(new URL('scripts/prepare.mjs', root), 'utf8')
    expect(prepare).toContain("rmSync(join(root, 'lib')")
    expect(prepare).toContain('spawnSync(process.execPath')
    const networkTokens = ['node:' + 'http', 'node:' + 'https', 'node:' + 'net', 'http' + '://', 'https' + '://']
    for (const token of networkTokens) expect(prepare).not.toContain(token)
    expect(prepare).not.toMatch(new RegExp('\\bfetch\\s*\\('))
  })
})
