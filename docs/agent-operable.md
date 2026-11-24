# Agent-operable pieces

An AI running inside a product can read Pane pieces and operate them through their own handlers, without screenshots or synthetic clicks. The idea comes from the agent bridge in Vercel Labs' UI SDK (`createAgent`, `snapshot()`, `act()`, an `allow` gate, changes tagged `source: "agent"`). Pane does not depend on it: this is our own small code, with no dependencies.

## The contract

Two parts, joined by one global registry and no import.

**1. A piece describes itself.** Each operable piece carries a 48-line inline stub (`useAgentNode`) and calls it once:

```tsx
useAgentNode(rootRef, {
  id: agentId,                    // optional prop, becomes the ref
  kind: "modal",
  label: title,                   // the accessible name
  value: { open },                // plain JSON state
  actions: {
    open: { run: () => openIt(), disabled: open },
    dismiss: { run: () => dismiss(), disabled: !open || !dismissible },
    confirm: { run: confirm, disabled: !open, destructive: `${confirmLabel}: ${description}` },
  },
})
```

The stub writes `{ el, node }` into `globalThis[Symbol.for("pane.agent")]`, a `{ v: 1, nodes: Map, listeners: Set }` object that whoever arrives first creates, and pings `listeners` when the piece mounts, unmounts or its `value` changes.

`value` must be plain JSON (the stub serialises it on every render to notice changes). An action has `run(args)`, optional typed `args` (`{ name, type: "string" | "number" | "boolean", enum?, optional?, description? }`), `disabled`, and `destructive` (`true`, a sentence for the person who will be asked, or a function of the args that returns either). `run` calls the same functions a press or a key calls, so the piece's callbacks (`onOpenChange`, `onConfirm`, ...) fire, focus and ARIA behave as they do for a person, and a built-in demo loop stops as it does at a first touch. `run` may return a promise that resolves when the action has finished (a hold that takes 1.2 seconds).

**2. The app reads and acts through `src/lib/agent-bridge.ts`.**

```ts
const agent = createAgentBridge({ allow: (request, { signal }) => askThePerson(request, signal) })

agent.snapshot()   // [{ ref, kind, label, value, actions: [{ name, args?, description?, destructive?, disabled? }] }]
await agent.act("modal-1", "open")                     // { ok: true, ref, action, value }
await agent.act("Deploy plan", "setMode", { step: "notify", mode: "ask" })
agent.subscribe((event) => log(event))                 // add | remove | change | act
agent.current()                                        // the request being run, or null
```

- `ref` is the piece's `agentId`, or `<kind>-<n>` in the order the bridge first saw the piece. A generated ref does not survive a remount, so give a piece an `agentId` when the agent should find it again. `act` also takes a label when exactly one piece has it.
- `act` runs one request at a time: find the piece, find the action, refuse a disabled one, check the args against their declared types, ask the gate, check again that the action is still possible and that what was approved is still what would happen (a person may have changed the piece while the gate waited), call `run`, wait for it to settle, return the new `value`. A failure is `{ ok: false, error: { code, message } }` with `not_found`, `ambiguous`, `unknown_action`, `disabled`, `bad_args`, `denied` or `failed`; it never throws. A `run` that has not finished after `timeout` (10 s by default), or whose piece unmounts meanwhile, fails and the queue moves on.
- `change` events carry `source: "agent"` when they happen while a request for that piece is running, and `source: "page"` for anything else (a person, the app, the piece's own loop). Inside the piece's own callbacks, `agent.current()` says the same thing synchronously.
- `snapshot()` only reads. It never calls `run`.

## How actions are gated

A request is `{ ref, kind, label, action, args, destructive, reason? }`. It is destructive when the action says so, or when the piece sits inside an element with `data-agent-confirm="what it does"`. Pieces mark what commits something on a person's behalf: `confirm` on Modal, Hold to Confirm and Action Drum, `commit` on Swipe Row, `grant` on Scope Words, `go` on Plan Words, `apply` on Diff Review, `rerun` on Terminal Transcript. Opening, closing, selecting and revealing are not.

`allow(request, { signal })` returns `true`, `false` or a promise of either, so it can show the app's own approval UI. It is called for every request, and only `true` allows: any other answer, a throw or a rejection is a refusal. **Without one, the default gate allows everything except destructive requests**, which fail with `denied` and the reason. A piece inside `data-agent-hidden` is left out of the snapshot, cannot be acted on, and its label and value appear in no event (becoming hidden reads as a `remove`, coming back as an `add`).

## How it stays dependency-free

- The stub imports nothing and is the same text in every piece (a check compares them). A piece copied on its own from the shadcn registry builds and works as before: its entry sits in a Map that nothing reads, at the cost of one object per mounted piece.
- The helper is one file with no imports: no React, no DOM needed to load it (it runs under plain Node for its checks). It is a registry item of its own (`agent-bridge`, `registry:lib`), so adding it later lights up every operable piece already on the page with no change to them.
- The registry object carries `v: 1`. A helper that meets a newer shape leaves it alone.

## Pieces

| Piece | `value` | Actions (destructive in bold) |
| --- | --- | --- |
| Modal | `{ open }` | `open`, `dismiss`, **`confirm`** |
| Popover | `{ open: id \| null, items }` | `open(id)`, `close` |
| Tooltip | `{ open: id \| null, items }` (toolbar) or `{ open, text }` (wrapper) | `show(id?)`, `hide`, `press(id)` (toolbar) |
| Drawer | `{ open, snap, snapPoints }` (`snap` is `null` while closed) | `open`, `close`, `snapTo(snap)` |
| Swipe Row | `{ items, revealed: { id, side } \| null, removed }` | `reveal(id, side)`, `close`, **`commit(id, action)`**, `restore` |
| Hold to Confirm | `{ phase, progress }` (`progress` is `null` during a hold) | **`confirm`** (plays the full hold), `reset` |
| Action Drum | `{ value, confirmed, options }` | `select(id)`, **`confirm`** (every verb: the card is where a person answers the agent). No `reset`: a person has no way back inside the piece either |
| Scope Words | `{ granted: id \| null, options }` | **`grant(id)`**, `revoke` |
| Plan Words | `{ modes, started, steps }` | `setMode(step, mode)`, **`go`** |
| Range Bar | `{ range, compare, filters, from, to, compareFrom, compareTo, sentence }` | `setPreset(id)`, `setDates(from, to)`, `setCompare(compare)`, `setFilter(facet, ids?)` (only with facets) |
| Run Health | `{ passed, total, rows, selected, lastProblem }` | `select(row, run)`, `clear` |
| Diff Review | `{ decisions, left, applied, focus }` | `decide(hunk, decision)`, `undo`, **`apply`** |
| Terminal Transcript | `[{ id, command, status, exitCode, lines, open }]`, one per command block | `copy(block)`, **`rerun(block)`**, `fold(block, open)` |
| Change Tree | `{ selected, sort, closedFolders, files }` | `select(path)`, `expandAll`, `collapseAll`, `sort(by)` |

To make another piece operable: paste the stub, add an `agentId?: string` prop, call `useAgentNode` with the root ref.

## WebMCP

WebMCP (`document.modelContext.registerTool`, W3C Web Machine Learning CG draft of 13 November 2026) lets a page hand tools to the browser's own agent. Chrome 157 has it behind `chrome://flags/#enable-webmcp-testing` (or `--enable-features=WebMCP`) and an origin trial; it is not on by default, and no other browser ships it. `registerWebMCP(agent)` registers two tools, `pane_snapshot` (`readOnlyHint`) and `pane_act` (`consequentialHint`), both `untrustedContentHint` because results contain page text, and returns a function that removes them. Without `document.modelContext` it does nothing. The same two definitions are exported as `agentTools` with JSON Schemas, and `callAgentTool(agent, name, input)` routes a call, for an app that runs its own model. The bridge's gate applies whoever calls.

## Not covered yet

Fourteen pieces opt in; the demo page shows the first nine. There is no `query` for long lists, no secret values, and labels are not de-duplicated for the app. An approval UI is the app's to build; the demo at `#/agent-operable` shows one.
