/**
 * CLI command to get 1 new message from stream that has not been delivered to anyone else
 * - docker run -d --name redis -p 6379:6379 redis:latest
 * - docker exec -it redis redis-cli
 * - XGROUP CREATE pingbase:website workers $ MKSTREAM
 */
export {};
//# sourceMappingURL=worker.d.ts.map