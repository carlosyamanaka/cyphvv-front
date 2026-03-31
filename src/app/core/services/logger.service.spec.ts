import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

describe('LoggerService', () => {
    let service: LoggerService;
    let originalProduction: boolean;

    beforeEach(() => {
        originalProduction = environment.production;
        service = new LoggerService();

        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        environment.production = originalProduction;
        vi.restoreAllMocks();
    });

    it('mascara campos sensiveis em log no ambiente de desenvolvimento', () => {
        environment.production = false;

        service.log('evento', {
            email: 'dev@cyphvv.com',
            nested: {
                token: 'abc',
                safe: 'valor-ok',
            },
        });

        expect(console.log).toHaveBeenCalledWith('[LOG] evento', {
            email: '[REDACTED]',
            nested: {
                token: '[REDACTED]',
                safe: 'valor-ok',
            },
        });
    });

    it('nao executa log() em producao', () => {
        environment.production = true;

        service.log('nao-deve-logar', { token: 'sigilo' });

        expect(console.log).not.toHaveBeenCalled();
    });

    it('em producao, warn() e error() nao incluem payload sensivel', () => {
        environment.production = true;

        service.warn('aviso', { authorization: 'Bearer abc' });
        service.error('falha', { password: '123456' });

        expect(console.warn).toHaveBeenCalledWith('[WARN] aviso');
        expect(console.error).toHaveBeenCalledWith('[ERROR] falha');
    });
});
