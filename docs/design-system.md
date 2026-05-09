# Cyphvv Design System (Obsidian-First)

## 1. Objetivo
Criar uma interface fiel à linguagem do Obsidian: workspace escuro, painéis bem definidos, leitura confortável, foco em conteúdo e hierarquia clara de informação.

## 2. Princípios de Design
- **Workspace antes de marketing:** a interface deve parecer uma área de trabalho, não uma landing page.
- **Densidade controlada:** muito conteúdo visível sem ficar poluído.
- **Contraste orientado por papel:** canvas, painel, elevação e destaque possuem níveis claros.
- **Acentos pontuais:** azul para ação primária, laranja para sinalização/acento.
- **Estado e feedback:** hover, focus e active sempre perceptíveis.
- **Glassmorphism contextual:** usado em modais e cards sobrepostos a fundos imersivos.
- **Fundos imersivos:** cada rota principal tem um backdrop fotográfico tratado com gradiente + blur para profundidade.

## 3. Paleta

Tokens definidos em `src/styles.scss` e acessíveis globalmente via CSS Custom Properties.

### 3.1 Neutros (base Obsidian)

| Token | Valor | Uso |
|---|---|---|
| `--color-bg-canvas` | `#14171f` | Fundo de página global |
| `--color-bg-surface` | `#1c212b` | Painéis primários, sidebars |
| `--color-bg-elevated` | `#242b37` | Cards elevados, dropdowns |
| `--color-bg-soft-blue` | `#1f2d42` | Acentos de navegação ativos |
| `--color-bg-soft-orange` | `#3a2b1f` | Acentos de alerta suave |

### 3.2 Texto

| Token | Valor | Uso |
|---|---|---|
| `--color-text-primary` | `#e6ecf6` | Texto principal, títulos |
| `--color-text-secondary` | `#b5c0d3` | Texto de suporte, labels |
| `--color-text-muted` | `#8593ac` | Metadados, placeholders, datas |

### 3.3 Bordas

| Token | Valor | Uso |
|---|---|---|
| `--color-border-soft` | `#313a4b` | Bordas discretas entre painéis |
| `--color-border-strong` | `#3c465c` | Bordas de inputs, separadores |

### 3.4 Marca e Acentos

| Token | Valor | Uso |
|---|---|---|
| `--color-brand-blue` | `#66a9ff` | Links, ações primárias, nav ativo |
| `--color-brand-blue-strong` | `#3f8df0` | Gradientes de botões primários |
| `--color-brand-orange` | `#ff9f5b` | Acentos secundários, hover em logout |
| `--color-brand-orange-strong` | `#ea7b2c` | Gradientes de destaque |
| `--color-focus-ring` | `#8ec0ff` | Outline de foco acessível |
| `--color-danger` | `#ff7272` | Erros de validação |

## 4. Tokens de Estrutura

### 4.1 Sombras

| Token | Valor |
|---|---|
| `--shadow-sm` | `0 8px 22px rgba(7, 10, 16, 0.28)` |
| `--shadow-md` | `0 16px 36px rgba(7, 10, 16, 0.36)` |
| `--shadow-lg` | `0 22px 48px rgba(7, 10, 16, 0.46)` |

### 4.2 Border Radius

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `0.55rem` | Inputs, chips pequenos |
| `--radius-md` | `0.85rem` | Cards secundários |
| `--radius-lg` | `1.1rem` | Modais, painéis principais |
| `--radius-pill` | `9999px` | Badges, botões pill, nav links |

## 5. Tipografia
- **Família principal:** `Manrope`, `Segoe UI`, sans-serif (definido em `--font-sans`).
- **Títulos:** peso 700–800, tracking reduzido (`letter-spacing` negativo ou zero).
- **Corpo:** peso 400–500, entrelinha 1.45–1.6.
- **Metadados:** tamanho menor (0.68–0.78rem), cor muted, uppercase opcional.
- **Font smoothing:** `-webkit-font-smoothing: antialiased` ativo globalmente.

## 6. Fundos Imersivos por Rota

Cada rota usa uma imagem de fundo diferente tratada com gradiente escurecedor + blur, criando profundidade sem poluir a UI.

| Rota | Imagem | Técnica |
|---|---|---|
| `/login`, `/registro` | `home_digital_art.jpg` | Gradiente linear `to bottom` de 60% → 95% de opacidade escura |
| `/mundos` | `city_purple.jpg` | `background-image` com `before` para blur + `after` para gradiente radial |
| `/mundos/:id` | `tower.jpg` | Pseudo-elemento `::before` com `scale(1.05)` + `blur(2px)`, radial gradient no `::after` |

> **Padrão recorrente:** pseudo-elemento `::before` para blur/escurecimento da imagem, `::after` para gradiente radial de acento sutil. Isso evita que o blur afete o conteúdo da página.

## 7. Componentes

### 7.1 Header (`app-header`)
- Fundo semi-transparente `rgba(20, 24, 33, 0.82)` com `backdrop-filter: blur(8px)`.
- `border-bottom` suave com `--color-border-soft`.
- `position: sticky; top: 0; z-index: 100`.
- **Nav link ativo:** cor `--color-brand-blue`, fundo `--color-bg-soft-blue`, indicador horizontal (linha de 2px com gradiente azul → laranja no `::after`).
- **User pill:** badge com gradiente `soft-blue → soft-orange` exibindo o nome do usuário.
- **Botão Sair:** ghost com borda `--color-border-strong`, hover muda borda para `--color-brand-orange`.

### 7.2 App Shell
- `<app-shell>` envolve todas as rotas autenticadas com `<app-header>` + `<router-outlet>`.
- Conteúdo principal limitado a `min(100%, 1220px)` centralizado.
- Auth pages (login/registro) ficam **fora** do shell — sem header.

### 7.3 Cards e Painéis (Vault)
- **Painel lateral (sidebar):** `320px` fixo, scroll interno, `backdrop-filter: blur(12px)`, borda suave.
- **Painéis de nota:** grade de 2 colunas, colapsam para 1 em mobile (`< 940px`).
- **Note panel grid:** `grid-template-columns: minmax(0, 1fr) auto` — conteúdo + coluna de imagem lateral (180px).
- Cards da sidebar com hover `translateY(-1px)` sutil; card ativo recebe `box-shadow` inset azul.

### 7.4 Card Image Box
- Dimensões: `width: 180px`, `aspect-ratio: 3/4`.
- Fallback visual: exibe `/img/dummy.jpg` quando `card.imageUrl` não está definido.
- Template: `[src]="selectedCard.imageUrl || '/img/dummy.jpg'"`.
- Botão "+" overlay aparece no `:hover` do container (opacidade 0 → 1, `translateY(4px)` → `translateY(0)`).
- Sem animação de zoom na imagem (por decisão de design).

### 7.5 Botões

| Variante | Classe | Estilo |
|---|---|---|
| Primário | `.save-button`, `.floating-create-button` | Gradiente azul, hover `translateY(-1px)` |
| Secundário | `.secondary-action` | `--color-bg-elevated`, sem borda, sombra suave |
| Ghost/Discreet | `.discreet-add-btn` | Fundo `rgba(255,255,255,0.03)`, borda dashed |
| Ícone | `.icon-btn`, `.icon-action` | Transparente, dimensão 1.8–2.2rem |
| Pill (nav) | `.logout-button` | Borda `--color-border-strong`, pill radius |

### 7.6 Inputs e Textareas
- Fundo `rgba(50, 50, 58, 0.56)`, sem borda, `box-shadow: inset 0 1px 3px rgba(0,0,0,0.2)`.
- Focus: `outline: 2px solid var(--color-focus-ring)`.
- Placeholder: cor `--color-text-muted`.
- **Textarea de seção:** fundo transparente, sem borda, sem `box-shadow` — comporta-se como área de texto pura inline.

### 7.7 Modais
- Backdrop: `position: fixed; inset: 0; backdrop-filter: blur(6px); background: rgba(5,7,12,0.62)`.
- Caixa: `border-radius: 0.9rem`, gradiente escuro, borda sutil, `box-shadow` forte.
- Fechamento ao clicar no backdrop.

### 7.8 Tree List (sidebar de cards)
- Scroll interno com `max-height: 19rem`.
- Item com `background: rgba(28, 29, 35, 0.8)`, hover sutil.
- Item ativo: `box-shadow: inset 0 0 0 2px rgba(102, 169, 255, 0.4)`.

## 8. Layout

### 8.1 Estrutura Geral
- Conteúdo principal: `min(100%, 1220px)`, centralizado via margin auto.
- **Vault page** (`/mundos/:id`): ocupa `100vw`, usa `margin-left: calc(50% - 50vw)` para full-bleed.

### 8.2 Grid do Vault
```
vault-shell
├── vault-sidebar (320px fixo)
└── vault-editor (1fr)
    └── note-panels (repeat(2, 1fr) → 1fr quando único)
        └── note-panel
            └── note-panel-grid (1fr + 180px)
                ├── note-panel-content
                └── note-panel-image-col
```

### 8.3 Breakpoints Responsivos
- `< 940px`: vault colapsa para coluna única, `note-panel-grid` vira coluna única, `note-panels` vira 1 coluna.
- `< 768px` (header): `user-pill` some, nav-links reduzem gap e font-size.

## 9. Padrões de Ícones

Biblioteca: `lucide-angular`. Ícones usados via `<lucide-icon [img]="IconRef" [size]="N" strokeWidth="N">`.

**Mapa de ícones por tipo de card** (definido em `iconMap` no `WorldDetailPageComponent`):

| `iconType` (string) | Ícone Lucide |
|---|---|
| `user` | `User` |
| `calendar` | `Calendar` |
| `shield` | `Shield` |
| `map` | `Map` |
| `users` | `Users` |
| `eye` | `Eye` |
| `crosshair` | `Crosshair` |
| `star` | `Star` |
| `map-pin` | `MapPin` |
| `crown` | `Crown` |
| `book-open` | `BookOpen` |
| `sun` | `Sun` |
| `book` | `Book` |
| `ghost` | `Ghost` |
| `scroll-text` | `ScrollText` |
| *(desconhecido)* | `FileQuestion` |

## 10. Acessibilidade
- Contraste AA mínimo para texto e controles.
- Estados de foco obrigatórios via `outline: 2px solid var(--color-focus-ring)` — definidos globalmente em `styles.scss` para `a`, `button`, `input`, `textarea`.
- `aria-label` em botões sem texto legível (fechar painel, adicionar imagem, etc.).
- `aria-hidden="true"` em imagens decorativas (logo no header).
- `color-scheme: dark` declarado no `body`.

## 11. Aplicação no Produto

| Rota | Componente | Características |
|---|---|---|
| `/login` | `LoginPageComponent` | Full-screen, glassmorphism card, Google Auth |
| `/registro` | `RegisterPageComponent` | Idem login |
| `/mundos` | `WorldsPageComponent` | Panel centralizado, lista de mundos em grid |
| `/mundos/:id` | `WorldDetailPageComponent` | Vault shell (sidebar + editor duplo) |
| `/conta` | `AccountPageComponent` | Card de identidade (não documentado ainda) |
