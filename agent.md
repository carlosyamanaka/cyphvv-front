# agent.md - Padroes do Projeto Cyphvv

## Objetivo

Aplicacao Angular para worldbuilding com autenticacao via Firebase Auth (Google).

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

## Observacoes para IA

- Antes de alterar fluxos de login, revisar auth.service.ts e auth.guard.ts.
- Ao adicionar nova feature, seguir a estrutura: features/<feature>/pages e, quando preciso, components.
- Se alterar comportamento de rota, atualizar app.routes.ts e validar com build.
