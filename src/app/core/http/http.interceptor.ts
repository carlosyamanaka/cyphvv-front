import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const logger = inject(LoggerService);
    const authService = inject(AuthService);

    return from(authService.waitForAuthReady()).pipe(
        switchMap(async () => {
            const user = authService.currentUser();
            const token = user ? await user.getIdToken() : null;

            const modifiedReq = req.clone({
                setHeaders: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                withCredentials: true,
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
