# Cyphvv

Aplicacao Angular focada em worldbuilding com autenticacao via Google.

## Como rodar

```bash
npm install
npm start
```

Acesse http://localhost:4200.

## Fluxo atual

- /login: entrada com Google
- /registro: criacao de conta com Google
- Toda autenticacao usa somente Google OAuth

## Estrutura principal

- src/app/features/auth/pages: paginas de login e registro
- src/app/features/auth/components: botao de autenticacao Google
- src/app/core/services/auth.service.ts: disparo do fluxo OAuth
- src/app/layout: shell com cabecalho e rodape

## Integracao OAuth

Agora o login usa Firebase Authentication com Google via popup.

### 1) Criar projeto no Firebase

- Acesse o Firebase Console e crie seu projeto.
- Ative Authentication > Sign-in method > Google.
- Em Authentication > Settings > Authorized domains, adicione `localhost` para desenvolvimento.

### 2) Configurar credenciais no frontend

Preencha o arquivo `.env` com as chaves do seu app web no Firebase (Project settings > Your apps).

`.env` e a unica fonte de verdade das credenciais.

Use `.env.example` como modelo.

Depois sincronize os environments com:

```bash
npm run sync-env
```

Os arquivos gerados sao:

- Desenvolvimento: `src/environments/environment.ts`
- Producao: `src/environments/environment.production.ts`

Nao edite manualmente os arquivos em `src/environments`; eles sao gerados automaticamente.

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`
- `measurementId`

### 3) Rodar a aplicacao

```bash
npm install
npm start
```

Para forcar ambiente de desenvolvimento:

```bash
npm run ng -- serve --configuration development
```

Para build de producao:

```bash
npm run build
```

O build de producao usa `fileReplacements` e troca automaticamente:

- `src/environments/environment.ts` -> `src/environments/environment.production.ts`

Ao clicar em "Continuar com Google" ou "Cadastrar com Google", o popup de login do Google sera aberto.

### Observacao

Se as credenciais do Firebase nao forem preenchidas, a autenticacao nao inicia e o erro aparece no console para facilitar debug.
