"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const auth_1 = require("./auth");
const token = (0, auth_1.generateJwt)({ email: 'demo@pingbase.dev' });
const payload = (0, auth_1.verifyJwt)(token);
strict_1.default.equal(payload.email, 'demo@pingbase.dev');
console.log('auth jwt ok');
