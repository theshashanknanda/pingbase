/**
 * CLI command to get 1 new message from stream that has not been delivered to anyone else
 * - > XGROUP CREATE pingbase:website workers $ MKSTREAM
 * - XREADGROUP GROUP workers worker-1 COUNT 1 STREAMS pingbase:website >
 */
export {};
//# sourceMappingURL=worker.d.ts.map