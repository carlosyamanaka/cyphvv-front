import { FirebaseOptions } from 'firebase/app';
import { environment } from '../../../environments/environment';

export const firebaseWebConfig: FirebaseOptions = environment.firebase;

export function hasFirebaseWebConfig(config: FirebaseOptions): boolean {
    const requiredKeys: Array<keyof FirebaseOptions> = [
        'apiKey',
        'authDomain',
        'projectId',
        'appId',
    ];

    return requiredKeys.every((key) => {
        const value = config[key];
        return typeof value === 'string' && value.trim().length > 0;
    });
}