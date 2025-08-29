"use strict";
/**
 * CLI command to get 1 new message from stream that has not been delivered to anyone else
 * - > XGROUP CREATE pingbase:website workers $ MKSTREAM
 * - XREADGROUP GROUP workers worker-1 COUNT 1 STREAMS pingbase:website >
 */
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const prisma_1 = require("../generated/prisma");
var WebSiteStatus;
(function (WebSiteStatus) {
    WebSiteStatus[WebSiteStatus["Up"] = 0] = "Up";
    WebSiteStatus[WebSiteStatus["Down"] = 1] = "Down";
    WebSiteStatus[WebSiteStatus["Unknown"] = 2] = "Unknown";
})(WebSiteStatus || (WebSiteStatus = {}));
const main = async () => {
    // connect prisma
    const prisma = new prisma_1.PrismaClient();
    // connect redis
    const redis = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
    await redis.connect();
    // read worker name from CLI
    const WORKER_NAME = process.argv[2];
    // get stream credentials
    const STREAM_NAME = "pingbase:website";
    const GROUP_NAME = "workers";
    // process job function for pinging each website
    const processJob = async (msg) => {
        // @ts-ignore
        const { website, url, region } = msg.message;
        let status = 'Unknown';
        let responseTime = Date.now();
        // Ping website
        try {
            const res = await fetch(`${url}`);
            status = res.ok ? 'Up' : 'Down';
        }
        catch (e) {
            status = "Down";
        }
        responseTime = Date.now() - responseTime;
        // Save tick in database
        await prisma.websiteTick.create({
            data: {
                website_id: website,
                response_time: responseTime,
                status: status,
                region_id: region,
                createdAt: new Date(),
            },
        });
        console.log(`[${WORKER_NAME}] Finished processing ${url}: ${status} (${responseTime}ms)`);
    };
    // run worker for each stream message
    const runWorker = async () => {
        console.log(`${WORKER_NAME} Worker: STARTED`);
        while (true) {
            const result = await redis.xReadGroup(GROUP_NAME, WORKER_NAME, {
                key: 'pingbase:website',
                id: '>',
            }, {
                COUNT: 1,
                BLOCK: 5000,
            });
            // console.log(result)
            if (result && Array.isArray(result)) {
                for (const stream of result) {
                    // @ts-ignore
                    for (const msg of stream?.messages) {
                        await processJob(msg);
                        await redis.xAck(STREAM_NAME, GROUP_NAME, msg.id);
                    }
                }
            }
        }
    };
    runWorker();
};
main();
