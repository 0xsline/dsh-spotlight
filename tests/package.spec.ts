import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
  name: string
  exports: Record<string, unknown>
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
})
