import express from "express"
import { Request, Response } from "express"
import dotenv from "dotenv"
import { PrismaClient } from '../generated/prisma'
const { auth } = require('express-oauth2-jwt-bearer');
import { createClient } from "redis";
import cors from "cors"

// At the top of server.ts
import './scheduler'; // This will start the scheduler
import './worker';    // This will start the worker

dotenv.config();

const app = express();
app.use(express.json());
const prisma = new PrismaClient();

app.use(cors())

const redis = createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false
    }
});
redis.connect().catch(e => {
    console.log(e)
});

// Authorization middleware
const checkJwt = auth({
    audience: 'https://pingbase-api',
    issuerBaseURL: `https://dev-lyuzcmb11nq1kss6.us.auth0.com/`,
});

// Create router
const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    return res.json({
        success: true,
        message: "Welcome to PingBase API",
    })
})

// get all websites
router.get('/allWebsites/:email', checkJwt, async (req: Request, res: Response) => {
    const email = req.params.email;

    const allWebsites = await prisma.website.findMany({
        include: {
            tickes: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            }
        },
        where: {
            email: email,
        },
    })

    return res.json({
        success: true,
        message: "List of all websites",
        data: allWebsites,
    })
})

// create a website
router.post('/website', async (req: Request, res: Response) => {
    const { email, url } = req.body;

    // create website
    const website = await prisma.website.create({
        data: {
            email: email,
            url: url,
            timeAdded: new Date()
        }
    })

    return res.json({
        success: true,
        message: "Website created and added to the queue",
        data: website,
    })
})

// delete a website
router.delete('/website', async (req: Request, res: Response) => {
    const { email, website_id } = req.body;

    await prisma.websiteTick.deleteMany({
        where: {
            website_id: website_id,
        }
    })

    const result = await prisma.website.delete({
        where: {
            id: website_id,
            email: email,
        }
    })

    return res.json({
        success: true,
        message: "Website deleted successfully",
        data: result,
    })
})

// get last 20 ticks of a website
router.get('/status/:websiteId', async (req: Request, res: Response) => {
    const ticks = await prisma.websiteTick.findMany({
        where: {
            website_id: req.params.websiteId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: 20,
        include: {
            region: true,
        }
    })

    // if (!ticks.length) {
    //     return res.status(404).json({ 
    //         success: true,
    //         message: 'No ticks found for this website',
    //         data: ticks,
    //     });
    // }

    return res.json(ticks);
})

// Mount router at /api/v1
app.use('/api/v1', router);

app.listen(process.env.PORT, () => {
    console.log(`Running at ${process.env.PORT}`)
})
