# Ponytail & Simplification Rules — ARIA Desktop

Strict rule: `ponytail` (minimalist, zero-bloat, simplest solution) and `ponytail-review` (over-engineering review) are always loaded and enforced across all tasks.

## 1. The Simplification Ladder
Always stop at the first rung that holds:
1. **YAGNI**: If it's a speculative need, skip it.
2. **Reuse**: Check if a helper, utility, or pattern already exists in the repo before writing new code.
3. **Standard Library / Native**: Use TypeScript/JavaScript standard library and native web platform features (`CSS`, native elements) before pulling libraries.
4. **Existing Dependencies**: Use already installed packages; never add new dependencies when a few clean lines suffice.
5. **Minimal Working Code**: Write the shortest, clearest diff that completely solves the problem.

## 2. Review for Over-Engineering (`ponytail-review`)
- Before completing tasks, review changes specifically to eliminate unnecessary abstractions, single-impl interfaces, premature factories, dead configuration, or boilerplate scaffolding.
