import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function value(name) {
  return process.env[name] ?? '';
}

function environmentFileContent(isProduction, prefix) {
  return `import { FirebaseOptions } from 'firebase/app';

export interface AppEnvironment {
  production: boolean;
  apiUrl: string;
  firebase: FirebaseOptions;
}

type RuntimeEnv = Record<string, string | undefined>;

function runtimeEnv(): RuntimeEnv {
  const globalWithEnv = globalThis as typeof globalThis & { __env?: RuntimeEnv };
  return globalWithEnv.__env ?? {};
}

function runtimeValue(name: string): string {
  return runtimeEnv()[name] ?? '';
}

export const environment: AppEnvironment = {
  production: ${isProduction},
  apiUrl: runtimeValue('${prefix}_API_URL') || '/api',
  firebase: {
    apiKey: runtimeValue('${prefix}_FIREBASE_API_KEY'),
    authDomain: runtimeValue('${prefix}_FIREBASE_AUTH_DOMAIN'),
    projectId: runtimeValue('${prefix}_FIREBASE_PROJECT_ID'),
    storageBucket: runtimeValue('${prefix}_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: runtimeValue('${prefix}_FIREBASE_MESSAGING_SENDER_ID'),
    appId: runtimeValue('${prefix}_FIREBASE_APP_ID'),
    measurementId: runtimeValue('${prefix}_FIREBASE_MEASUREMENT_ID'),
  },
};
`;
}

function runtimeEnvFileContent() {
  const keys = [
    'DEV_API_URL',
    'DEV_FIREBASE_API_KEY',
    'DEV_FIREBASE_AUTH_DOMAIN',
    'DEV_FIREBASE_PROJECT_ID',
    'DEV_FIREBASE_STORAGE_BUCKET',
    'DEV_FIREBASE_MESSAGING_SENDER_ID',
    'DEV_FIREBASE_APP_ID',
    'DEV_FIREBASE_MEASUREMENT_ID',
    'PROD_API_URL',
    'PROD_FIREBASE_API_KEY',
    'PROD_FIREBASE_AUTH_DOMAIN',
    'PROD_FIREBASE_PROJECT_ID',
    'PROD_FIREBASE_STORAGE_BUCKET',
    'PROD_FIREBASE_MESSAGING_SENDER_ID',
    'PROD_FIREBASE_APP_ID',
    'PROD_FIREBASE_MEASUREMENT_ID',
  ];

  const content = {
    __env: Object.fromEntries(keys.map((key) => [key, value(key)])),
  };

  return `window.__env = Object.freeze(${JSON.stringify(content.__env, null, 2)});\n`;
}

const developmentFilePath = path.join(rootDir, 'src', 'environments', 'environment.ts');
const productionFilePath = path.join(rootDir, 'src', 'environments', 'environment.production.ts');
const runtimeEnvFilePath = path.join(rootDir, 'public', 'env.js');

fs.writeFileSync(developmentFilePath, environmentFileContent(false, 'DEV'), 'utf8');
fs.writeFileSync(productionFilePath, environmentFileContent(true, 'PROD'), 'utf8');
fs.writeFileSync(runtimeEnvFilePath, runtimeEnvFileContent(), 'utf8');

console.log('Environment files and public/env.js synchronized from .env');