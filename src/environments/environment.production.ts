import { FirebaseOptions } from 'firebase/app';

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
  production: true,
  apiUrl: '/api',
  firebase: {
    apiKey: runtimeValue('PROD_FIREBASE_API_KEY'),
    authDomain: runtimeValue('PROD_FIREBASE_AUTH_DOMAIN'),
    projectId: runtimeValue('PROD_FIREBASE_PROJECT_ID'),
    storageBucket: runtimeValue('PROD_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: runtimeValue('PROD_FIREBASE_MESSAGING_SENDER_ID'),
    appId: runtimeValue('PROD_FIREBASE_APP_ID'),
    measurementId: runtimeValue('PROD_FIREBASE_MEASUREMENT_ID'),
  },
};
