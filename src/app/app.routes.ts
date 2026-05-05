import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/pages/login.page').then(
                (m) => m.LoginPageComponent
            ),
    },
    {
        path: 'registro',
        loadComponent: () =>
            import('./features/auth/pages/register.page').then(
                (m) => m.RegisterPageComponent
            ),
    },
    {
        path: '',
        loadComponent: () =>
            import('./layout/app-shell.component').then((m) => m.AppShellComponent),
        children: [
            {
                path: 'mundos',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/worlds/pages/worlds.page').then(
                        (m) => m.WorldsPageComponent
                    ),
            },
            {
                path: 'mundos/:id',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/worlds/pages/world-detail.page').then(
                        (m) => m.WorldDetailPageComponent
                    ),
            },
            {
                path: 'conta',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./features/account/pages/account.page').then(
                        (m) => m.AccountPageComponent
                    ),
            },
            {
                path: '**',
                redirectTo: 'login',
            },
        ],
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];
