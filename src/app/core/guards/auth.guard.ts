import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return canActivate(authService, router);
};

async function canActivate(authService: AuthService, router: Router): Promise<boolean | UrlTree> {
    await authService.waitForAuthReady();

    if (authService.isAuthenticated()) {
        return true;
    }

    return router.parseUrl('/login');
}