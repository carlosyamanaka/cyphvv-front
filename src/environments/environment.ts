import { FirebaseOptions } from 'firebase/app';

export interface AppEnvironment {
  production: boolean;
  firebase: FirebaseOptions;
  apiUrl: string;
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
  production: false,
  apiUrl: '/api',
  firebase: {
    apiKey: runtimeValue('DEV_FIREBASE_API_KEY'),
    authDomain: runtimeValue('DEV_FIREBASE_AUTH_DOMAIN'),
    projectId: runtimeValue('DEV_FIREBASE_PROJECT_ID'),
    storageBucket: runtimeValue('DEV_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: runtimeValue('DEV_FIREBASE_MESSAGING_SENDER_ID'),
    appId: runtimeValue('DEV_FIREBASE_APP_ID'),
    measurementId: runtimeValue('DEV_FIREBASE_MEASUREMENT_ID'),
  },
};
