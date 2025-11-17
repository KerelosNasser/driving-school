# Fix PresenceTracker TypeScript Error

## Task
Fix TypeScript error in `lib\realtime\PresenceTracker.ts` where `stalePresence` could be undefined but is being passed to event emitters expecting `EditorPresence`.

## Steps
- [ ] Analyze the error and understand the root cause
- [ ] Fix the type safety issue in cleanupStalePresence method
- [ ] Verify the fix handles the undefined case properly
- [ ] Test that the code compiles without TypeScript errors

## Solution
Add null/undefined check before emitting events to ensure stalePresence is always a valid EditorPresence object.
