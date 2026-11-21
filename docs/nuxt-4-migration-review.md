# Nuxt 4 migration review and refactoring plan

Reviewed on 2026-11-18 against the current working tree. The migration is still
uncommitted; this document records the findings and the agreed follow-up scope.

The findings below record the behavior observed before the follow-up implementation.
The review found a significant message-merging performance regression and several
older behaviors carried forward from Nuxt 2. Priorities below describe the impact
of the current behavior, rather than implying that every defect was introduced by
the upgrade.

## Findings

### 1. P1: Message merging becomes expensive as history grows

Sources: [mergeMessages](../app/tools/message-list.ts) and the
[messages store](../app/stores/messages.ts).

`mergeMessages()` rebuilds the current list using repeated linear searches. A
single incoming message therefore causes quadratic work over the loaded history.
This matters because the migrated chat retains loaded history instead of trimming
it to a small fixed window.

A local Node/Vue benchmark took approximately 1.4 seconds to merge one incoming
message into 2,000 Vue-reactive messages. This is a local measurement, not a
cross-browser performance guarantee.

Replace repeated scans with indexes by server ID and `randomId`. Preserve message
ordering, overlapping-page deduplication, optimistic-message reconciliation, and
the scroll anchoring behavior.

### 2. P2: Stale responses overwrite newer message content

Source: [mergeMessages](../app/tools/message-list.ts).

Incoming records replace existing records unconditionally. A targeted reproduction
confirmed that an older record replaces an already edited message. Responses from
history, polling, and subscriptions need a consistent freshness policy.

Account for message update times, deletion state, and poll-specific freshness.
Do not assume that message timestamps alone capture every poll update.

### 3. P2: Failed sends lose drafts and leave pending messages

Source: [footer composer](../app/components/global/footer/footer.vue).

The composer clears the editor before awaiting the mutation. A reproduced network
exception left the editor empty and the optimistic message permanently pending.
Rejected edits also leave edit mode without reliably preserving the attempted
changes.

Introduce explicit sending, failed, and retry states. Preserve drafts and
attachments on failure, handle both GraphQL errors and transport exceptions, and
avoid overwriting text entered while a request is in flight.

### 4. P2: Arrow Up starts editing from unrelated controls

Source: [footer keyboard handler](../app/components/global/footer/footer.vue).

The document-wide handler checks neither the focused control nor the current
draft, and ignores `event.defaultPrevented`. A targeted reproduction started
message editing from an already handled Arrow Up event in a settings input.
The same handler can interfere with mention navigation.

Scope the shortcut to an empty, focused composer. Respect handled events and
preserve keyboard behavior in menus, dialogs, and mention suggestions.

### 5. P2: Email confirmation leaves authentication state stale

Sources: [confirmation page](../app/pages/confirm_email.vue) and the
[authentication store](../app/stores/auth.ts).

Successful confirmation redirects without refreshing the current user. The email
confirmation reminder can remain until reload. This was also observed during the
earlier live browser check against the local backend.

Refresh the appropriate authenticated session after confirmation, preserving
correct behavior when the link is opened by a guest or by a different user.

## Refactoring order

1. **Extract composer behavior.** Separate drafts, edit state, mutations, uploads,
   and failure handling from the footer's rendering. Keep the Tiptap component
   focused on editing. Resolve findings 3 and 4 during this work.
2. **Separate message reconciliation from live transport.** Give history loading,
   polling, and subscriptions one indexed reconciliation policy and consistent
   session invalidation. Resolve findings 1 and 2 here.
3. **Adopt Nuxt file-based routing.** Replace the eager page and modal imports in
   [main page and nested routes](../app/pages/index.vue), preserving route names, URLs,
   layout selection, and nested modal behavior. Use SSR-aware data loading where
   appropriate. Resolve finding 5 as part of the account-route work.
4. **Finish the Reka integration and permission handling.** Prefer public
   `ContextMenu` primitives over the internal anchor import in the
   [context-menu wrapper](../app/components/global/context-menu/context-menu.vue).
   Centralize message action permissions. The
   [message menu guard](../app/components/global/message/message.vue) currently
   tests permission objects instead of `.granted` and compares a message ID with
   the user ID. Preserve backend authorization and distinguish viewing a menu
   from permission to perform its actions.

## Constraints

- Keep Nuxt 4, Tiptap 3, Reka UI, pnpm, shared Rhapsodic lint tooling, and YAML
  locales.
- Preserve the existing API protocol, route names, URLs, and intended UI behavior.
- Retain Chrome 49, Firefox 52, Safari 14.1, and iOS 14.5 support under the existing
  Browserslist policy. Keep the documented compatibility patches unless a tested
  replacement makes them unnecessary.
- Keep the Axios upload path while authenticated XHR upload progress and legacy
  browser support require it.
- Preserve the existing uncommitted migration work. Commits, pushes, and deployment
  require a separate request.

## Completion checklist

- [x] Indexed reconciliation removes quadratic work on normal incoming updates.
- [x] Stale responses cannot undo newer edits, deletion state, or poll updates.
- [x] Failed sends and edits preserve recoverable drafts and attachments.
- [x] Keyboard shortcuts respect editor focus, drafts, and handled events.
- [x] Email confirmation refreshes the correct session without requiring reload.
- [x] Composer behavior is extracted with clear typed state and actions.
- [x] History, polling, and subscriptions share reconciliation and session rules.
- [x] File-based routes preserve existing navigation and modal behavior.
- [x] Context menus use public Reka primitives and consistent permission checks.
- [x] Targeted regressions cover the failure cases above.
- [x] Lint, typecheck, production build, unit/SSR tests, and browser regressions pass.
- [x] Relevant live-browser checks pass against the local backend; actual legacy
  engines are rechecked when dependencies or compatibility-sensitive code change.
- [x] This document records the final validation results and any remaining limits.

## Review validation

At review time, lint, typecheck, and all 18 unit/SSR tests passed. The SSR checks ran
against the existing production build; no fresh build or browser pass was run for
this review. Targeted source-level reproductions exposed draft loss, global
keyboard interception, stale-record replacement, and quadratic message merging.
These cases identify gaps in the existing passing suite.

## Implementation and validation

Implemented on 2026-11-18:

- [Typed composer controller](../app/tools/message-composer.ts) and
  [Nuxt adapter](../app/composables/message-composer.ts) own editing, uploads,
  retained drafts, and retry state. Responses cannot erase newer input. Failed
  image messages reuse their existing attachment IDs and client identity.
- [Indexed reconciliation](../app/tools/message-list.ts) replaces repeated history
  scans and preserves newer message content, deletion state, and poll snapshots.
  The same 2,000-reactive-message local benchmark completed in approximately 11 ms.
  A deterministic access-count regression checks that normal merging remains linear.
- [Message streaming](../app/composables/message-stream.ts) is separate from the
  store. History, polling, subscriptions, and mutations use a shared session
  version; Apollo deduplication is disabled across credential changes.
- [File-based routes](../app/pages/index.vue) preserve the existing named URLs and
  modal hierarchy. Profile data loads through an SSR-aware composable. Confirmation
  refreshes the matching session and preserves guest and different-user sessions.
- [Public Reka context menus](../app/components/global/context-menu/context-menu.vue)
  replace imperative shared menu instances and the internal anchor import.
  [Centralized permissions](../app/composables/message-permissions.ts) check actual
  ownership and granted actions.
- Escape cancellation runs through Tiptap's shortcut handling, after mention
  handling. TanStack's resize callback retains the visible row when content above
  it grows after scrolling upward.
- GraphQL generation now separates schema and operation types, uses explicit
  date scalar mappings, and retains the existing public import module.

Validation records:

- Production build, lint (ESLint, Stylelint, Knip), and typecheck pass.
- All 28 unit/SSR tests and all 43 production browser regressions pass.
- Live local-backend checks passed for registration, matching-account confirmation
  without reload, sending, editing, keyboard cancellation, deletion, direct profile
  navigation, and mobile layout. Test messages were deleted. No console errors or
  hydration warnings were observed in the final live check.
- Actual Chrome 49.0.2623.75 (Electron 0.37.8 with Node integration disabled)
  passed the production harness, including login, keyboard focus, Reka menus,
  settings, formatted paste, message editing, failed-send recovery, retry, and
  virtualized history. No runtime errors were recorded.
- Firefox 52.9.0 ESR passed the same production flows, including the public context
  menu, message editing, draft recovery, retry, and virtualized history. No runtime
  errors were recorded.

The legacy-engine harnesses use local mock APIs; the separate live-browser pass
uses the local Nest backend. Safari and iOS engines were not run in this environment;
their existing target policy remains unchanged. No commit, push, or deployment was
performed.
