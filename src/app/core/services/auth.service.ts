import {
    Injectable,
    PLATFORM_ID,
    computed,
    inject,
    signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, initializeApp } from 'firebase/app';
import {
    Auth,
    GoogleAuthProvider,
    User,
    getAuth,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
} from 'firebase/auth';
import { LoggerService } from './logger.service';
import { firebaseWebConfig, hasFirebaseWebConfig } from './firebase.config';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly logger = inject(LoggerService);
    private readonly googleProvider = new GoogleAuthProvider();
    private readonly currentUserSignal = signal<User | null>(null);

    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
    readonly userDisplayName = computed(() => {
        const user = this.currentUserSignal();
        if (!user) {
            return 'Visitante';
        }

        return user.displayName?.trim() || user.email || 'Aventureiro';
    });

    private firebaseApp: FirebaseApp | null = null;
    private auth: Auth | null = null;
    private hasLoggedMissingConfig = false;
    private authReadyPromise: Promise<void>;
    private resolveAuthReady: (() => void) | null = null;
    private authReadyResolved = false;

    constructor() {
        this.authReadyPromise = new Promise<void>((resolve) => {
            this.resolveAuthReady = resolve;
        });
        this.googleProvider.setCustomParameters({ prompt: 'select_account' });
        this.startAuthStateListener();
    }

    waitForAuthReady(): Promise<void> {
        return this.authReadyPromise;
    }

    async loginWithGoogle(): Promise<boolean> {
        const auth = this.getOrCreateAuth();
        if (!auth) {
            return false;
        }

        try {
            await signInWithPopup(auth, this.googleProvider);
            this.logger.log('Login com Google realizado com sucesso.');
            return true;
        } catch (error) {
            this.logger.error('Falha ao autenticar com Google no Firebase.', error);
            return false;
        }
    }

    async logout(): Promise<void> {
        const auth = this.getOrCreateAuth();
        if (!auth) {
            return;
        }

        try {
            await signOut(auth);
            this.logger.log('Logout realizado com sucesso.');
        } catch (error) {
            this.logger.error('Falha ao realizar logout no Firebase.', error);
        }
    }

    private getOrCreateAuth(): Auth | null {
        if (!isPlatformBrowser(this.platformId)) {
            return null;
        }

        if (!hasFirebaseWebConfig(firebaseWebConfig)) {
            if (!this.hasLoggedMissingConfig) {
                this.logger.error('Configuracao Firebase ausente. Preencha firebaseWebConfig antes de autenticar.');
                this.hasLoggedMissingConfig = true;
            }
            return null;
        }

        if (!this.firebaseApp) {
            this.firebaseApp = initializeApp(firebaseWebConfig);
            this.auth = getAuth(this.firebaseApp);
        }

        return this.auth;
    }

    private startAuthStateListener(): void {
        const auth = this.getOrCreateAuth();
        if (!auth) {
            this.markAuthReady();
            return;
        }

        onAuthStateChanged(auth, (user) => {
            this.currentUserSignal.set(user);
            this.markAuthReady();
        });
    }

    private markAuthReady(): void {
        if (this.authReadyResolved) {
            return;
        }

        this.authReadyResolved = true;
        this.resolveAuthReady?.();
        this.resolveAuthReady = null;
    }
}
