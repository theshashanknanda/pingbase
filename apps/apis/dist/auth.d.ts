import type { NextFunction, Request, Response } from 'express';
export type JwtPayload = {
    email: string;
    iat: number;
    exp: number;
};
export declare function generateJwt(payload: {
    email: string;
}): string;
export declare function verifyJwt(token: string): JwtPayload;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
export declare function getAuthEmail(req: Request): string | null;
//# sourceMappingURL=auth.d.ts.map