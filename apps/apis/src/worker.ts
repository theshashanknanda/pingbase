/**
 * CLI command to get 1 new message from stream that has not been delivered to anyone else
 * - > XGROUP CREATE pingbase:website workers $ MKSTREAM
 * - XREADGROUP GROUP workers worker-1 COUNT 1 STREAMS pingbase:website > 
 */

import { createClient } from 'redis';
import dotenv from 'dotenv';
import { Prisma, PrismaClient, Website } from '../generated/prisma';

enum WebSiteStatus {
  Up,
  Down,
  Unknown,
}

const main = async () => {
    // connect prisma
    const prisma = new PrismaClient()

    // connect redis
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();

    // read worker name from CLI
    const WORKER_NAME = process.argv[2] as string;

    // get stream credentials
    const STREAM_NAME = "pingbase:website";
    const GROUP_NAME = "workers";

    // process job function for pinging each website
    const processJob = async (msg: Record<string, string>) => {
        // @ts-ignore
        const { website, url, region } = msg.message;
        
        let status: "Up" | "Down" | "Unknown" = 'Unknown'
        let responseTime = Date.now();

        // Ping website
        try{
            const res = await fetch(`${url}`);
            status = res.ok ? 'Up' : 'Down';
        }catch(e){
            status = "Down"
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
    }

    // run worker for each stream message
    const runWorker = async () => {
        console.log(`${WORKER_NAME} Worker: STARTED`)

        while(true){
            const result = await redis.xReadGroup(
                GROUP_NAME,
                WORKER_NAME,{
                    key: 'pingbase:website',
                    id: '>',
                }, {
                    COUNT: 1, 
                    BLOCK: 5000,
                },
            );

            // console.log(result)
            if(result && Array.isArray(result)){
                for(const stream of result){
                    // @ts-ignore
                    for(const msg of stream?.messages){
                        await processJob(msg);
                        await redis.xAck(STREAM_NAME, GROUP_NAME, msg.id);
                    }
                }
            }
        }
    }
    runWorker()
}

main()
