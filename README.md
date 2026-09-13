# dsh-session-rotate-on-compact

A DSH plugin that rotates the outbound LLM session ID after each successful compaction, without creating a new DSH conversation.

## What it does

- Keeps the same DSH conversation/session.
- Keeps the original outbound session ID during normal requests.
- Keeps the original outbound session ID while the compaction request itself is running.
- After a successful `compaction/end`, generates a new outbound session ID.
- Uses that new outbound session ID on the next normal LLM request.
- Does not modify `messages`, so the plugin does not re-inject compacted-away history.
- Does not rotate on failed/aborted compactions.

## How it works

The plugin intercepts the final `llm/stream` call and replaces only `GenerateOptions.sessionId` for normal requests after a successful compaction. It does not rebuild or alter the message list.

It listens for `compaction/end` and rotates only when the event has no error.

## Install

From the DSH project directory:

```powershell
pnpm dsh plugin --profile web add "C:\path\to\dsh-session-rotate-on-compact"
```

Then restart DSH.

## Important

This plugin changes the outbound LLM session ID used by DSH. Whether that causes a proxy to treat the request as a new conversation depends on how the selected DSH provider/adapter maps `GenerateOptions.sessionId` to the provider's request headers or fields.

This plugin intentionally does not rewrite request messages. The next normal request therefore uses the message surface that DSH itself produces after compaction.

## License

MIT
