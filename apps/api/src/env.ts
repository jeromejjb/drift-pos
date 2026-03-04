/**
 * Load env before any other imports that use process.env (e.g. Stripe).
 * Must be the first import in index.ts.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const apiEnv = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: apiEnv });
