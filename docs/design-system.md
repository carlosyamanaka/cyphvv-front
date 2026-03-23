# Cyphvv Design System (Obsidian-First)

## 1. Objetivo
Criar uma interface fiel a linguagem do Obsidian: workspace escuro, paineis bem definidos, leitura confortavel, foco em conteudo e hierarquia clara de informacao.

## 2. Principios de Design
- Workspace antes de marketing: a interface deve parecer uma area de trabalho, nao uma landing page.
- Densidade controlada: muito conteudo visivel sem ficar poluido.
- Contraste orientado por papel: canvas, painel, elevacao e destaque possuem niveis claros.
- Acentos pontuais: azul para acao primaria e laranja para sinalizacao/acento.
- Estado e feedback: hover, focus e active sempre perceptiveis.

## 3. Paleta

### 3.1 Neutros (base Obsidian)
- `--color-bg-canvas`: `#14171f`
- `--color-bg-surface`: `#1c212b`
- `--color-bg-elevated`: `#242b37`
- `--color-bg-soft-blue`: `#1f2d42`
- `--color-bg-soft-orange`: `#3a2b1f`

- `--color-text-primary`: `#e6ecf6`
- `--color-text-secondary`: `#b5c0d3`
- `--color-text-muted`: `#8593ac`

- `--color-border-soft`: `#313a4b`
- `--color-border-strong`: `#3c465c`

### 3.2 Marca e acentos
- `--color-brand-blue`: `#66a9ff`
- `--color-brand-blue-strong`: `#3f8df0`
- `--color-brand-orange`: `#ff9f5b`
- `--color-brand-orange-strong`: `#ea7b2c`
- `--color-focus-ring`: `#8ec0ff`
- `--color-danger`: `#ff7272`

## 4. Tokens de estrutura
- `--shadow-sm`: `0 8px 22px rgba(7, 10, 16, 0.28)`
- `--shadow-md`: `0 16px 36px rgba(7, 10, 16, 0.36)`
- `--shadow-lg`: `0 22px 48px rgba(7, 10, 16, 0.46)`

- `--radius-sm`: `0.55rem`
- `--radius-md`: `0.85rem`
- `--radius-lg`: `1.1rem`
- `--radius-pill`: `9999px`

## 5. Tipografia
- Familia principal: Manrope.
- Titulos: peso 700-800 e tracking reduzido.
- Corpo: peso 400-500 e entrelinha 1.45 a 1.6.
- Metadados: caixa alta opcional, tamanho menor, cor muted.

## 6. Componentes

### 6.1 App Bar
- Fundo semi-transparente escuro com blur.
- Linha inferior discreta para separar da area de conteudo.
- Item ativo com fundo elevado + indicador horizontal.

### 6.2 Cards e paineis
- Fundo `surface` ou `elevated`.
- Borda suave com contraste baixo.
- Elevar no hover sem exagero.

### 6.3 Botoes
- Primario: gradiente azul.
- Secundario: fundo surface + borda forte.
- Ghost: transparente com borda/acento.

### 6.4 Inputs e Textareas
- Fundo canvas escuro.
- Borda forte.
- Focus ring azul claro.
- Placeholder muted.

### 6.5 Dialog
- Overlay escuro com blur.
- Caixa em surface elevado + sombra media.

## 7. Layout
- Conteudo principal em largura fixa fluida (ate 1200).
- Paginas complexas em shell de paineis (sidebar + editor + lista).
- Mobile: colapsar multi-coluna para unica coluna.

## 8. Acessibilidade
- Contraste AA minimo para texto e controles.
- Estados de foco obrigatorios.
- Nao depender apenas de cor para estado.

## 9. Aplicacao no produto
- Login/Registro: painel central em tema escuro com ambientacao suave.
- Mundos: hero de workspace + grade de cards.
- Detalhe do mundo: shell estilo vault (sidebar, editor, notas).
- Conta: card de identidade com dados e metadados.
