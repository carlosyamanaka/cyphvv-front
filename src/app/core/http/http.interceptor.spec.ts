import { TestBed } from '@angular/core/testing';
import {
    HttpErrorResponse,
    HttpRequest,
    HttpResponse,
} from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { errorInterceptor } from './http.interceptor';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

describe('errorInterceptor', () => {
    const waitForAuthReady = vi.fn<() => Promise<void>>();
    const currentUser = vi.fn();
    const loggerError = vi.fn();

    beforeEach(() => {
        waitForAuthReady.mockResolvedValue(undefined);
        currentUser.mockReturnValue(null);
        loggerError.mockReset();

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        waitForAuthReady,
                        currentUser,
                    },
                },
                {
                    provide: LoggerService,
                    useValue: {
                        error: loggerError,
                    },
                },
            ],
        });
    });

    it('anexa Authorization e withCredentials para rota interna da API', async () => {
        const getIdToken = vi.fn().mockResolvedValue('token-123');
        currentUser.mockReturnValue({ getIdToken });

        let interceptedRequest: HttpRequest<unknown> | undefined;
        const request = new HttpRequest('GET', '/api/worlds');

        const response$ = TestBed.runInInjectionContext(() =>
            errorInterceptor(request, (nextRequest) => {
                interceptedRequest = nextRequest;
                return of(new HttpResponse({ status: 200, body: { ok: true } }));
            })
        );

        await firstValueFrom(response$);

        expect(waitForAuthReady).toHaveBeenCalledTimes(1);
        expect(getIdToken).toHaveBeenCalledTimes(1);
        expect(interceptedRequest?.headers.get('Authorization')).toBe('Bearer token-123');
        expect(interceptedRequest?.withCredentials).toBe(true);
    });

    it('nao anexa Authorization nem withCredentials para dominio externo', async () => {
        const getIdToken = vi.fn().mockResolvedValue('token-externo');
        currentUser.mockReturnValue({ getIdToken });

        let interceptedRequest: HttpRequest<unknown> | undefined;
        const request = new HttpRequest('GET', 'https://example.com/api/worlds');

        const response$ = TestBed.runInInjectionContext(() =>
            errorInterceptor(request, (nextRequest) => {
                interceptedRequest = nextRequest;
                return of(new HttpResponse({ status: 200, body: { ok: true } }));
            })
        );

        await firstValueFrom(response$);

        expect(getIdToken).not.toHaveBeenCalled();
        expect(interceptedRequest?.headers.has('Authorization')).toBe(false);
        expect(interceptedRequest?.withCredentials).toBe(false);
    });

    it('registra erro HTTP via LoggerService quando o next falha', async () => {
        const request = new HttpRequest('GET', '/api/fail');
        const httpError = new HttpErrorResponse({
            status: 500,
            statusText: 'Server Error',
            url: '/api/fail',
        });

        const response$ = TestBed.runInInjectionContext(() =>
            errorInterceptor(request, () => throwError(() => httpError))
        );

        await expect(firstValueFrom(response$)).rejects.toBe(httpError);

        expect(loggerError).toHaveBeenCalledWith(
            'HTTP Error',
            expect.objectContaining({
                status: 500,
                url: '/api/fail',
            })
        );
    });
});
