## Summary

Explain the change in 1–3 sentences.

## Type of Change

Select all that apply (keep at least one):

- [ ] feat (new feature)
- [ ] fix (bug fix)
- [ ] refactor (code restructuring without behavior change)
- [ ] perf (performance improvement)
- [ ] docs (documentation only)
- [ ] chore (maintenance / tooling)
- [ ] test (adding or improving tests)
- [ ] ci (CI/CD related changes)
- [ ] build (build system or dependencies)

## Conventional Commit Title

`<type>(optional scope): <short imperative summary>`

Examples:

- `feat(chat): add streaming buffer reuse`
- `fix(audio): handle sample rate mismatch`
- `docs(README): clarify local model setup`

If breaking change, append `!` after type/scope and add a `BREAKING CHANGE:` footer below.

## Checklist

- [ ] Conventional commit title
- [ ] Tests added/updated (unit)
- [ ] E2E / accessibility not regressed
- [ ] Typescript passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] A11y scan passes (`npm run test:a11y`)
- [ ] Story / docs updated (if UI change)
- [ ] No unexpected bundle size growth

## Screenshots / Recordings (if UI)

Add before/after images or short video/gif.

## Breaking Change?

Describe impact and migration steps if yes. Use footer format:

```
BREAKING CHANGE: <description>
```

## Release Notes (Concise)

One line highlight for CHANGELOG (will be auto-generated but you can suggest wording).

## Additional Context

Anything reviewers should know (trade-offs, follow-ups, performance notes).
