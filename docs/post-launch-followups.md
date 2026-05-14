# Post-Launch Followups

## Status color tokenization

123 instances of hardcoded status colors (`bg-emerald-*`, `bg-red-*`, `bg-amber-*`, etc.) exist across the codebase. These are semantically correct as hardcoded values because status meanings do not change per theme, but tokenizing them would enable:

- Easier global tweaks to the warning/success/danger palette
- Theme-specific status colors if needed for purple accent
- More consistent code style

Decision: deferred until post-launch. Discuss whether to:

1. Define dedicated `--status-success`, `--status-warning`, `--status-danger` tokens and sweep all 123 instances
2. Keep as hardcoded with no design need for theme-specific status colors
3. Define tokens but only use them in new code, without sweeping existing usage

Audit source: `docs/stitch-implementation-audit.md` (P1-2 context)
