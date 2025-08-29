"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("../generated/prisma");
const { auth } = require('express-oauth2-jwt-bearer');
const redis_1 = require("redis");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const prisma = new prisma_1.PrismaClient();
app.use((0, cors_1.default)());
const redis = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
redis.connect().catch(e => {
    console.log(e);
});
// Authorization middleware
const checkJwt = auth({
    audience: 'https://pingbase-api',
    issuerBaseURL: `https://dev-lyuzcmb11nq1kss6.us.auth0.com/`,
});
// Create router
const router = express_1.default.Router();
// get all websites
router.get('/allWebsites/:email', checkJwt, async (req, res) => {
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
    });
    return res.json({
        success: true,
        message: "List of all websites",
        data: allWebsites,
    });
});
// create a website
router.post('/website', async (req, res) => {
    const { email, url } = req.body;
    // create website
    const website = await prisma.website.create({
        data: {
            email: email,
            url: url,
            timeAdded: new Date()
        }
    });
    return res.json({
        success: true,
        message: "Website created and added to the queue",
        data: website,
    });
});
// delete a website
router.delete('/website', async (req, res) => {
    const { email, website_id } = req.body;
    await prisma.websiteTick.deleteMany({
        where: {
            website_id: website_id,
        }
    });
    const result = await prisma.website.delete({
        where: {
            id: website_id,
            email: email,
        }
    });
    return res.json({
        success: true,
        message: "Website deleted successfully",
        data: result,
    });
});
// get last 20 ticks of a website
router.get('/status/:websiteId', async (req, res) => {
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
    });
    if (!ticks.length) {
        return res.status(404).json({
            success: true,
            message: 'No ticks found for this website',
            data: ticks,
        });
    }
    return res.json(ticks);
});
// Mount router at /api/v1
app.use('/api/v1', router);
app.listen(process.env.PORT, () => {
    console.log(`Running at ${process.env.PORT}`);
});
