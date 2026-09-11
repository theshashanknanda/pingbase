import express from "express"
import { Request, Response } from "express"
import dotenv from "dotenv"
import { PrismaClient } from '../generated/prisma'
import { createClient } from "redis";
import cors from "cors"
import crypto from "crypto";
import { generateJwt, requireAuth } from './auth';

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

const hashPassword = (password: string) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return false;
    const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
};

// Create router
const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    return res.json({
        success: true,
        message: "Welcome to PingBase API",
    })
})

router.post('/auth/signup', async (req: Request, res: Response) => {
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

    const token = generateJwt({ email: user.email });

    return res.json({
        success: true,
        message: 'Account created successfully.',
        user: { email: user.email },
        token,
    });
});

router.post('/auth/login', async (req: Request, res: Response) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateJwt({ email: user.email });
    return res.json({
        success: true,
        message: 'Login successful.',
        user: { email: user.email },
        token,
    });
});

// get all websites
router.get('/allWebsites/:email', requireAuth, async (req: Request, res: Response) => {
    const requestedEmail = String(req.params.email ?? '').trim().toLowerCase();
    const authEmail = (req as Request & { user?: { email?: string } }).user?.email?.trim().toLowerCase();

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
    })

    return res.json({
        success: true,
        message: "List of all websites",
        data: allWebsites,
    })
})

// create a website
router.post('/website', requireAuth, async (req: Request, res: Response) => {
    const authEmail = (req as Request & { user?: { email?: string } }).user?.email?.trim().toLowerCase();
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
    })

    return res.json({
        success: true,
        message: "Website created and added to the queue",
        data: website,
    })
})

// delete a website
router.delete('/website', requireAuth, async (req: Request, res: Response) => {
    const authEmail = (req as Request & { user?: { email?: string } }).user?.email?.trim().toLowerCase();
    const { email, website_id } = req.body;
    const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!authEmail || !targetEmail || authEmail !== targetEmail) {
        return res.status(403).json({ success: false, message: 'You can only delete your own websites.' });
    }

    await prisma.websiteTick.deleteMany({
        where: {
            website_id: website_id,
        }
    })

    const result = await prisma.website.delete({
        where: {
            id: website_id,
            email: targetEmail,
        }
    })

    return res.json({
        success: true,
        message: "Website deleted successfully",
        data: result,
    })
})

// get last 20 ticks of a website
router.get('/status/:websiteId', requireAuth, async (req: Request, res: Response) => {
    const authEmail = (req as Request & { user?: { email?: string } }).user?.email?.trim().toLowerCase();
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
    })

    return res.json(ticks);
})

// Mount router at /api/v1
app.use('/api/v1', router);

app.listen(process.env.PORT, () => {
    console.log(`Running at ${process.env.PORT}`)
})
