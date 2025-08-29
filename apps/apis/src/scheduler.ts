import { createClient } from "redis";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();
const redis = createClient({ url: process.env.REDIS_URL });
redis.connect().catch(e => {
    console.log(e)
})

const enqueueChecks = async () => {
    const websites = await prisma.website.findMany()

    for(const site of websites){
        console.log(`Adding ${site.url}`)
        // enqueue website in redis queue
        await redis.xAdd("pingbase:website", "*", {
            website: site.id,
            url: site.url,
            region: "c7a8d346-3cfa-4cda-b983-4c3da8342ea3",
        })
    }

    // cleanup ping records that are older than 24 hours
    await prisma.$executeRaw`
    DELETE FROM "WebsiteTick"
    WHERE "createdAt" < NOW() - INTERVAL '30 minutes'
    `;


}

const loop = async () => {
    while(true){
        await enqueueChecks();

        await new Promise((resolve) => setTimeout(resolve, 60_000))
    }
}

loop();
