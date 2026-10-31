import type { AdaptationRule, Build, BuildResult, Item, Threat } from './buildTypes'

export function validSequence(sequence: string[], build: Build, items: Record<string, Item>): boolean {
  if (sequence.length !== 6 || new Set(sequence).size !== 6) return false
  const groups = new Set<string>()
  for (const id of sequence) {
    const item = items[id]
    if (!item || !item.mayhem || !item.purchasable || item.patch !== build.patch || !item.allowedIdentities.includes(build.identity)) return false
    if (item.requiredChampion && item.requiredChampion !== build.championId) return false
    for (const group of item.groups) {
      if (groups.has(group)) return false
      groups.add(group)
    }
  }
  return build.essential.every(id => sequence.includes(id))
}

/** Pure, deterministic and scoped to a reviewed champion/style; no network or AI. */
export function adaptBuild(build: Build, selected: readonly Threat[], items: Record<string, Item>, rules: readonly AdaptationRule[]): BuildResult {
  const requested = [...new Set(selected)].sort()
  const result: BuildResult = { sequence: [...build.sequence], changes: [], unresolved: [...requested], warnings: [] }
  if (build.status !== 'reviewed' || !validSequence(build.sequence, build, items)) {
    result.warnings.push('Esta build precisa de revisão antes de receber adaptações automáticas.')
    return result
  }
  const covered = new Set<Threat>()
  const pinned = new Set<string>()
  const candidates = rules.filter(rule => rule.buildIds.includes(build.id) && rule.threats.some(t => requested.includes(t)))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))

  for (const rule of candidates) {
    const answers = rule.threats.filter(t => requested.includes(t))
    if (answers.every(t => covered.has(t))) continue
    const item = items[rule.itemId]
    if (!item || !item.mayhem || !item.purchasable || item.patch !== build.patch || !item.allowedIdentities.includes(build.identity)) continue
    if (rule.position < 1 || rule.position > 6 || !Number.isInteger(rule.position)) continue
    const before = [...result.sequence]
    const existing = before.indexOf(rule.itemId)
    if (pinned.has(rule.itemId) && existing >= 0 && existing < rule.position) {
      const previous = result.changes.find(change => change.itemId === rule.itemId)!
      previous.threats = [...new Set([...previous.threats, ...answers])]
      previous.reason += ` ${rule.reason}`
      answers.forEach(t => covered.add(t))
      continue
    }
    let next = [...before]
    let replaced: string | undefined
    let action: 'move' | 'replace' | 'keep'

    if (existing >= 0) {
      // A higher-priority answer cannot be moved by a lower-priority rule.
      if (pinned.has(rule.itemId)) continue
      const target = Math.min(existing, rule.position - 1)
      next.splice(existing, 1)
      next.splice(target, 0, rule.itemId)
      action = target === existing ? 'keep' : 'move'
    } else {
      // Only explicitly approved flexible items may leave this particular build.
      const replacement = rule.replaceable.find(id => next.includes(id) && !build.essential.includes(id) && !pinned.has(id))
      if (!replacement) continue
      replaced = replacement
      next.splice(next.indexOf(replacement), 1)
      next.splice(rule.position - 1, 0, rule.itemId)
      action = 'replace'
    }
    // Earlier adaptations retain their promised positions when rules compete.
    if ([...pinned].some(id => before.indexOf(id) !== next.indexOf(id))) continue
    if (!validSequence(next, build, items)) continue
    result.sequence = next
    pinned.add(rule.itemId)
    answers.forEach(t => covered.add(t))
    result.changes.push({ itemId: rule.itemId, previousItemId: replaced, previousPosition: existing < 0 ? undefined : existing + 1,
      position: next.indexOf(rule.itemId) + 1, action, threats: answers, reason: rule.reason, caveat: rule.caveat, ruleId: rule.id })
  }
  result.unresolved = requested.filter(t => !covered.has(t))
  return result
}
