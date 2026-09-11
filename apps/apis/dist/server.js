"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("../generated/prisma");
const redis_1 = require("redis");
const cors_1 = __importDefault(require("cors"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("./auth");
// At the top of server.ts
require("./scheduler"); // This will start the scheduler
require("./worker"); // This will start the worker
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const prisma = new prisma_1.PrismaClient();
app.use((0, cors_1.default)());
const redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false
    }
});
redis.connect().catch(e => {
    console.log(e);
});
const hashPassword = (password) => {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};
const verifyPassword = (password, stored) => {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash)
        return false;
    const candidate = crypto_1.default.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
};
// Create router
const router = express_1.default.Router();
router.get('/', (req, res) => {
    return res.json({
        success: true,
        message: "Welcome to PingBase API",
    });
});
router.post('/auth/signup', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Email and password are required. Password must be at least 6 characters.' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashPassword(password),
        },
    });
    const token = (0, auth_1.generateJwt)({ email: user.email });
    return res.json({
        success: true,
        message: 'Account created successfully.',
        user: { email: user.email },
        token,
    });
});
router.post('/auth/login', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    const token = (0, auth_1.generateJwt)({ email: user.email });
    return res.json({
        success: true,
        message: 'Login successful.',
        user: { email: user.email },
        token,
    });
});
// get all websites
router.get('/allWebsites/:email', auth_1.requireAuth, async (req, res) => {
    const requestedEmail = String(req.params.email ?? '').trim().toLowerCase();
    const authEmail = req.user?.email?.trim().toLowerCase();
    if (!authEmail || authEmail !== requestedEmail) {
        return res.status(403).json({ success: false, message: 'You can only view your own websites.' });
    }
    const allWebsites = await prisma.website.findMany({
        include: {
            tickes: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            }
        },
        where: {
            email: requestedEmail,
        },
    });
    return res.json({
        success: true,
        message: "List of all websites",
        data: allWebsites,
    });
});
// create a website
router.post('/website', auth_1.requireAuth, async (req, res) => {
    const authEmail = req.user?.email?.trim().toLowerCase();
    const { email, url } = req.body;
    const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!authEmail || !targetEmail || authEmail !== targetEmail) {
        return res.status(403).json({ success: false, message: 'You can only add websites to your own account.' });
    }
    const website = await prisma.website.create({
        data: {
            email: targetEmail,
            url: url,
            timeAdded: new Date(),
            user: {
                connect: {
                    email: targetEmail,
                }
            }
        }
    });
    return res.json({
        success: true,
        message: "Website created and added to the queue",
        data: website,
    });
});
// delete a website
router.delete('/website', auth_1.requireAuth, async (req, res) => {
    const authEmail = req.user?.email?.trim().toLowerCase();
    const { email, website_id } = req.body;
    const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!authEmail || !targetEmail || authEmail !== targetEmail) {
        return res.status(403).json({ success: false, message: 'You can only delete your own websites.' });
    }
    await prisma.websiteTick.deleteMany({
        where: {
            website_id: website_id,
        }
    });
    const result = await prisma.website.delete({
        where: {
            id: website_id,
            email: targetEmail,
        }
    });
    return res.json({
        success: true,
        message: "Website deleted successfully",
        data: result,
    });
});
// get last 20 ticks of a website
router.get('/status/:websiteId', auth_1.requireAuth, async (req, res) => {
    const authEmail = req.user?.email?.trim().toLowerCase();
    const websiteId = String(req.params.websiteId ?? '');
    if (!authEmail) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const website = await prisma.website.findUnique({
        where: { id: websiteId },
        select: { email: true },
    });
    if (!website || website.email !== authEmail) {
        return res.status(403).json({ success: false, message: 'You can only view your own website status.' });
    }
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
    return res.json(ticks);
});
// Mount router at /api/v1
app.use('/api/v1', router);
app.listen(process.env.PORT, () => {
    console.log(`Running at ${process.env.PORT}`);
});
