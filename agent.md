# agent.md - Padroes do Projeto Cyphvv

## Objetivo

Aplicacao Angular para worldbuilding com autenticacao via Firebase Auth (Google).

## Seguranca

- Verificar vulnerabilidades conhecidas sempre que for implementar uma funcionalidade.
- Dados sensiveis nao devem ser logados em producao.
- Arquivos de ambiente de runtime (public/env.js) sao gerados localmente e nao devem ser versionados.

## Arquitetura Atual

- Angular standalone components.
- Layout principal em src/app/layout com header e footer.
- Regras de autenticacao centralizadas em src/app/core/services/auth.service.ts.
- Rotas protegidas por src/app/core/guards/auth.guard.ts.

## Regras de Produto

- Login e cadastro sao apenas via Google.
- Rotas publicas: /login e /registro.
- Rotas autenticadas: /mundos e /conta.

## Convencoes Obrigatorias

- Manter TypeScript em modo strict.
- Usar ChangeDetectionStrategy.OnPush em componentes.
- Preferir signal/computed para estado local e de sessao.
- Evitar logica de negocio no template; manter no componente/servico.
- Usar imports explicitos por componente standalone.
- Para componentes de UI reutilizaveis, preferir input()/output().
- Evitar any; usar tipos explicitos e unknown quando necessario.

## Padrao de Seguranca Obrigatorio

- Dependencias:
- Rodar npm audit em toda release e tratar vulnerabilidades high/critical como bloqueadoras de merge.
- Manter Angular CLI/build e transitivas atualizadas em janela curta.
- Nao ignorar advisories de ReDoS/DoS em tooling quando afetarem pipeline ou ambientes compartilhados.

- Autenticacao e sessao:
- Centralizar Firebase Auth somente em AuthService.
- Nao persistir tokens manualmente em localStorage/sessionStorage/cookies no frontend.
- Decisoes de rota autenticada devem aguardar waitForAuthReady().
- Logout deve invalidar sessao local e redirecionar para /login.

- HTTP e API:
- Nao enviar Authorization para dominios externos; limitar anexacao de token a endpoints internos da API.
- Usar withCredentials apenas para rotas que realmente exigem cookie de sessao.
- Validar sempre apiUrl por ambiente para evitar envio de credenciais a origem incorreta.
- Tratar erros HTTP sem expor payload sensivel no console.

- Logs e observabilidade:
- Nao logar token, email completo, headers de auth, stack traces sensiveis ou resposta bruta da API em producao.
- Logger deve suportar nivel por ambiente (debug em dev, minimo em prod).

- Configuracao e segredos:
- .env e somente local; nunca versionar.
- public/env.js e arquivo gerado e nunca deve ir para o Git.
- Chaves do Firebase client-side nao sao segredo, mas qualquer chave server-side deve ficar fora do frontend.
- Validar dominios autorizados no Firebase Auth (dev e prod) antes de publicar.

- Frontend hardening:
- Evitar innerHTML e qualquer bypass de sanitizacao sem revisao de seguranca.
- Definir politicas de seguranca HTTP no deploy (CSP, X-Content-Type-Options, Referrer-Policy e afins) no servidor/CDN.
- Manter foco visivel e acessibilidade sem comprometer seguranca de navegacao.

## Padrao de Autenticacao

- Nao inicializar Firebase em multiplos lugares; usar apenas AuthService.
- Qualquer decisao de rota autenticada deve aguardar waitForAuthReady() quando aplicavel.
- Navegacao pos-login deve ir para /mundos.
- Logout deve limpar sessao e redirecionar para /login.

## Padrao de Rotas

- Novas telas autenticadas devem usar canActivate com authGuard.
- wildcard deve manter redirecionamento para /login.

## Padrao de Estilo e UX

- Manter estados de foco visivel em elementos interativos.
- Priorizar responsividade mobile-first.
- Evitar estilos globais excessivos; preferir estilos locais no componente.
- **Efeitos de Hover**: Ao fazer hover em botões ou elementos interativos, altere apenas cores (fundo, texto, borda). **Não aplique efeitos de elevação ou escala** (como `transform: scale()`, `transform: translateY()`, etc.).

## Observacoes para IA

- Antes de alterar fluxos de login, revisar auth.service.ts e auth.guard.ts.
- Ao adicionar nova feature, seguir a estrutura: features/<feature>/pages e, quando preciso, components.
- Se alterar comportamento de rota, atualizar app.routes.ts e validar com build.
- Ao alterar interceptor HTTP, revisar impacto em Authorization, withCredentials e CORS.
- Antes de merge, validar: npm audit, build de producao e checklist de seguranca deste documento.
- **Tratamento de Soft Delete (deleted = true):**
  - Não filtre registros no frontend baseando-se em atributos como `deleted === true` ao carregar dados da API. Toda filtragem de dados deletados é de responsabilidade da camada de repositório/banco de dados no backend.
  - No frontend, apenas atualize o array local (ex: `.filter(item => item.id !== deletedId)`) de forma síncrona/otimista ao finalizar a requisição de exclusão (`DELETE`) para refletir a remoção imediatamente na UI.
