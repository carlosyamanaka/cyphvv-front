# Arquitetura de Código — cyphvv-front

## Stack e Versão

- **Framework:** Angular (standalone components, signals, ChangeDetectionStrategy.OnPush)
- **Linguagem:** TypeScript
- **Estilos:** SCSS (inline nos componentes via `styles:` + global em `src/styles.scss`)
- **Ícones:** `lucide-angular`
- **Auth:** Firebase Authentication (Google OAuth via popup)
- **HTTP:** `HttpClient` encapsulado em `ApiService`

---

## Estrutura de Pastas

```
src/app/
├── core/
│   ├── guards/          # authGuard (funcional)
│   ├── http/            # interceptors (se houver)
│   └── services/
│       ├── api.service.ts       # wrapper HTTP
│       ├── auth.service.ts      # Firebase Auth + signals
│       ├── firebase.config.ts   # configuração Firebase
│       └── logger.service.ts    # log utilitário
├── features/
│   ├── auth/
│   │   ├── components/  # GoogleAuthButtonComponent
│   │   └── pages/       # login.page.ts, register.page.ts
│   ├── worlds/
│   │   ├── data-access/ # worlds.store.ts
│   │   ├── models/      # world.model.ts, world-card.model.ts, card-type.model.ts
│   │   └── pages/       # worlds.page.ts, world-detail.page.ts
│   └── account/
│       └── pages/       # account.page.ts
├── layout/
│   ├── app-shell.component.ts   # header + router-outlet
│   ├── header.component.ts
│   └── footer.component.ts
└── shared/
    ├── components/
    ├── directives/
    ├── pipes/
    └── ui/
```

---

## Padrões Angular

### Standalone Components
Todos os componentes usam `standalone: true` (implícito em Angular 19+ sem `NgModule`). Cada componente declara seus próprios `imports`.

### ChangeDetection
Todos os componentes usam `ChangeDetectionStrategy.OnPush`. A reatividade é garantida por **signals** e **computed**.

### Signals (Estado Reativo)
O estado local e derivado usa a API de Signals do Angular:
- `signal<T>(value)` — estado mutável
- `computed(() => ...)` — derivado, recalcula automaticamente
- `effect(() => ...)` — efeitos colaterais reativos (carregamento de dados, sincronização)
- `toSignal(observable$)` — conversão de Observable para Signal

**Exemplo de padrão recorrente** (`world-detail.page.ts`):
```typescript
// Estado por cardId usando Record
readonly sectionsByCardId = signal<Record<number, CardSection[]>>({});

// Atualização imutável
this.sectionsByCardId.update((current) => ({
  ...current,
  [cardId]: newSections,
}));
```

### Store Pattern (WorldsStore)
- Singleton via `providedIn: 'root'`.
- Estado mantido em `signal<T>()`.
- Mutações feitas com `.update()` imutável.
- Operações assíncronas retornam `Observable<T>` via `apiService`.
- Efeitos colaterais tratados com `.pipe(tap(), catchError())`.
- O componente subscreve e gerencia erros localmente.

```typescript
// Exemplo de operação no store
updateCardName(worldId: number, cardId: number, cardName: string) {
  return this.apiService.patch<WorldCard>(`/worlds/${worldId}/cards/${cardId}/name`, { cardName })
    .pipe(
      tap((updatedCard) => this.updateCardInList(worldId, updatedCard)),
      catchError((error) => { ... throw error; })
    );
}
```

---

## Padrões de UI

### Layout Vault (world-detail)
A página de detalhe é o componente mais complexo. Todo o CSS está **inline** no `styles:` do componente.

**Grid principal:**
- `.vault-shell`: `grid-template-columns: 320px 1fr`
- `.note-panels`: `repeat(2, 1fr)` → 1fr quando card único
- `.note-panel-grid`: `1fr auto` (conteúdo + coluna de imagem 180px)

**Painel de imagem do card:**
- `aspect-ratio: 3/4`
- Fallback via `[src]="card.imageUrl || '/img/dummy.jpg'"`
- Botão de upload como overlay que aparece no hover (sem zoom na imagem)

### Debounce para Auto-save
Seções de card são salvas automaticamente com debounce de 1 segundo:
```typescript
private readonly saveSectionsSubject = new Subject<number>();

// no constructor:
this.saveSectionsSubject.pipe(
  tap(cardId => this.isSavingSections.update(...)),
  debounceTime(1000)
).subscribe((cardId) => this.executeSaveSections(cardId));
```

### Multi-card View
Até 2 cards podem ser visualizados simultaneamente:
- `openCardIds` rastreia todos os abertos
- `activeCardId` determina qual é o ativo
- `visibleCards` computed retorna os 2 mais relevantes (ativo + mais recente)

### Optimistic Updates
Ao criar um card, um card temporário com `id: -Date.now()` é inserido imediatamente na lista e substituído pelo real após a resposta da API. Em caso de erro, é removido.

---

## Serviços

### ApiService
Wrapper simples do `HttpClient` que prefixa todas as chamadas com `environment.apiUrl`:
```typescript
get<T>(endpoint: string)       // GET
post<T>(endpoint, data)        // POST
put<T>(endpoint, data)         // PUT
patch<T>(endpoint, data)       // PATCH
delete<T>(endpoint)            // DELETE
```

### AuthService
- Gerencia Firebase Auth com `signal<User | null>`.
- `isAuthenticated` e `userDisplayName` são `computed`.
- `waitForAuthReady()` retorna uma Promise que resolve quando o estado de auth inicial é conhecido (usado em guards).
- Login via `signInWithPopup` com `GoogleAuthProvider`.

### AuthGuard
Guard funcional que usa `authService.waitForAuthReady()` antes de checar `isAuthenticated()`. Redireciona para `/login` se não autenticado.

---

## Modelos de Dados

```typescript
interface World {
  id: number;
  userId: string;
  worldName: string;
  createdAt: string;
  name?: string;         // normalizado no store
  summary?: string;      // normalizado no store
  createdAtLabel?: string;
}

interface CardType {
  id: number;
  worldId: number;
  cardTypeName: string;
  iconType: string;      // slug do ícone Lucide (ex: "user", "crown")
  createdAt: string;
  deleted: boolean;
  deletedAt?: string;
}

interface CardSection {
  id?: number;
  type: string;          // "description" | "text"
  content: string;
}

interface WorldCard {
  id: number;
  worldId: number;
  cardTypeId: number;
  cardName: string;
  sections?: CardSection[];
  createdAtLabel: string;
  aliases?: string[];
  imageUrl?: string;     // URL da imagem do card; fallback: /img/dummy.jpg
}
```

---

## Endpoints da API

Todos prefixados por `environment.apiUrl`:

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/worlds` | Lista mundos do usuário |
| `POST` | `/worlds` | Cria mundo |
| `GET` | `/worlds/:id/cards` | Lista cards do mundo |
| `POST` | `/worlds/:id/cards` | Cria card |
| `PATCH` | `/worlds/:id/cards/:cardId/name` | Atualiza nome |
| `PUT` | `/worlds/:id/cards/:cardId/sections` | Salva seções |
| `POST` | `/worlds/:id/cards/:cardId/aliases` | Adiciona alias |
| `DELETE` | `/worlds/:id/cards/:cardId/aliases/:alias` | Remove alias |
| `GET` | `/worlds/:id/card-types` | Lista tipos de card |
| `POST` | `/worlds/:id/card-types` | Cria tipo de card |

---

## Padrão de Soft Delete (Itens Deletados)

- **Filtragem no Backend (Banco de Dados):** O banco de dados e as consultas JPA são responsáveis por filtrar registros onde `deleted = false` (ex: `findByUserIdAndNotDeleted`), garantindo que dados inativos não sejam transmitidos.
- **Frontend Confia no Backend:** As listas recebidas da API (`/worlds`, `/worlds/:id/cards`, etc.) já vêm filtradas. O frontend não realiza filtragem local de `deleted === true` no carregamento dos dados.
- **Sincronização de Estado Local:** Ao excluir um item (chamada `DELETE`), o Store do frontend remove o registro do array local na memória por meio de um filtro simples do ID (ex: `cards.filter(c => c.id !== cardId)`) para atualizar a tela imediatamente, sem a necessidade de recarregar a lista inteira da API.

---

## Assets Públicos (`/public`)

| Arquivo | Uso |
|---|---|
| `/img/dummy.jpg` | Placeholder de imagem de card |
| `/img/city_purple.jpg` | Fundo da página `/mundos` |
| `/img/tower.jpg` | Fundo da página `/mundos/:id` |
| `/img/home_digital_art.jpg` | Fundo das páginas de auth |
| `/img/empty-cards.png` | Ilustração de estado vazio |
| `/icons/cyphvv-icon.png` | Ícone do logo no header |
| `/env.js` | Variáveis de ambiente em runtime |
