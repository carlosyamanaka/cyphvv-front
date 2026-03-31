import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(token|authorization|password|secret|cookie|email|apikey|api_key)/i;

function sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
    }

    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => {
            if (SENSITIVE_KEY_PATTERN.test(key)) {
                return [key, REDACTED];
            }

            return [key, sanitizeValue(item)];
        });

        return Object.fromEntries(entries);
    }

    return value;
}

@Injectable({
    providedIn: 'root',
})
export class LoggerService {
    log(message: string, data?: unknown): void {
        if (environment.production) {
            return;
        }

        console.log(`[LOG] ${message}`, sanitizeValue(data));
    }

    error(message: string, error?: unknown): void {
        const payload = sanitizeValue(error);
        if (environment.production) {
            console.error(`[ERROR] ${message}`);
            return;
        }

        console.error(`[ERROR] ${message}`, payload);
    }

    warn(message: string, data?: unknown): void {
        const payload = sanitizeValue(data);
        if (environment.production) {
            console.warn(`[WARN] ${message}`);
            return;
        }

        console.warn(`[WARN] ${message}`, payload);
    }
}
