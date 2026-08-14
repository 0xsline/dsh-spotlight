/** Searchable metadata shared by browser actions. */
export interface SearchCandidate {
  id: string
  kind: 'action' | 'command' | 'session' | 'plugin'
  title: string
  detail?: string
  keywords?: readonly string[]
}

/** One candidate plus its deterministic relevance score. */
export interface RankedCandidate<T extends SearchCandidate> {
  item: T
  score: number
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(new RegExp('\\s+', 'g'), ' ').trim()
}

function subsequenceScore(haystack: string, needle: string): number {
  let cursor = 0
  let first = -1
  let gaps = 0
  for (const char of needle) {
    const next = haystack.indexOf(char, cursor)
    if (next < 0) return -1
    if (first < 0) first = next
    gaps += next - cursor
    cursor = next + 1
  }
  return 120 - first * 2 - gaps
}

function tokenScore(title: string, haystack: string, token: string): number {
  if (title === token) return 1_000
  if (title.startsWith(token)) return 800 - title.length
  const titleIndex = title.indexOf(token)
  if (titleIndex >= 0) return 600 - titleIndex
  const textIndex = haystack.indexOf(token)
  if (textIndex >= 0) return 400 - textIndex
  return subsequenceScore(haystack, token)
}

/** Score a candidate. Negative values mean no match. */
export function scoreCandidate(candidate: SearchCandidate, query: string): number {
  const normalizedQuery = normalize(query)
  if (normalizedQuery === '') return 0
  const title = normalize(candidate.title)
  const haystack = normalize([
    candidate.title,
    candidate.detail ?? '',
    ...(candidate.keywords ?? []),
  ].join(' '))
  let score = 0
  for (const token of normalizedQuery.split(' ')) {
    const value = tokenScore(title, haystack, token)
    if (value < 0) return -1
    score += value
  }
  return score
}

/**
 * Display cap over an already-ranked list: keep at most `perKind` candidates
 * per kind in rank order. The underlying candidate set stays uncapped, so a
 * query can still surface anything the cap hides in the initial view.
 */
export function capPerKind<T extends SearchCandidate>(
  ranked: readonly RankedCandidate<T>[],
  perKind: number,
): RankedCandidate<T>[] {
  const counts = new Map<T['kind'], number>()
  return ranked.filter(({ item }) => {
    const current = counts.get(item.kind) ?? 0
    if (current >= perKind) return false
    counts.set(item.kind, current + 1)
    return true
  })
}

/** Rank matching candidates while preserving discovery order for equal scores. */
export function searchCandidates<T extends SearchCandidate>(
  candidates: readonly T[],
  query: string,
  limit = 12,
): RankedCandidate<T>[] {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new RangeError('search limit must be a positive integer')
  return candidates
    .map((item, order) => ({ item, order, score: scoreCandidate(item, query) }))
    .filter(result => result.score >= 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, limit)
    .map(({ item, score }) => ({ item, score }))
}
