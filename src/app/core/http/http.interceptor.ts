import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

function isInternalApiRequest(url: string): boolean {
    if (url.startsWith(environment.apiUrl)) {
        return true;
    }

    if (url.startsWith('/') && environment.apiUrl.startsWith('/')) {
        return url.startsWith(environment.apiUrl);
    }

    try {
        const currentOrigin = globalThis.location?.origin;
        if (!currentOrigin) {
            return false;
        }

        const apiOrigin = environment.apiUrl.startsWith('http')
            ? new URL(environment.apiUrl).origin
            : currentOrigin;

        const apiPath = environment.apiUrl.startsWith('http')
            ? new URL(environment.apiUrl).pathname
            : environment.apiUrl;

        const parsedUrl = new URL(url, currentOrigin);
        return parsedUrl.origin === apiOrigin && parsedUrl.pathname.startsWith(apiPath);
    } catch {
        return false;
    }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const logger = inject(LoggerService);
    const authService = inject(AuthService);

    return from(authService.waitForAuthReady()).pipe(
        switchMap(async () => {
            const user = authService.currentUser();
            const isInternalApi = isInternalApiRequest(req.url);
            const token = isInternalApi && user ? await user.getIdToken() : null;

            const modifiedReq = req.clone({
                setHeaders: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: isInternalApi,
            });

            return modifiedReq;
        }),
        switchMap((modifiedReq) => next(modifiedReq)),
        catchError((error: HttpErrorResponse) => {
            logger.error('HTTP Error', {
                status: error.status,
                message: error.message,
                url: error.url,
            });
            return throwError(() => error);
        })
    );
};
