# Documentação de Estilo das Telas de Autenticação

## Objetivo
O design das telas de Login e Registro foi elaborado com o foco de mesclar uma arte digital representativa do universo da aplicação com um visual limpo e minimalista para os formulários de entrada, garantindo uma interface bonita, linear e com alta usabilidade.

## Estilo do Fundo (Background)
Utilizamos a imagem `home_digital_art.jpg` como fundo, mas com um overlay em formato de gradiente linear (Linear Gradient). Esse filtro escurece suavemente a imagem de cima para baixo, criando profundidade e permitindo uma integração visual muito mais suave.

```css
background-image:
  linear-gradient(to bottom, rgba(20, 25, 35, 0.6) 0%, rgba(17, 21, 29, 0.95) 100%),
  url('/home_digital_art.jpg');
background-size: cover;
background-position: center;
background-repeat: no-repeat;
```
- **Gradiente Linear:** O tom base inicia em uma opacidade de 60% e vai até 95% na parte inferior, permitindo que a arte digital se misture sutilmente com as cores escuras do tema da aplicação, criando um aspecto "linear e contínuo".

## Cartão de Autenticação (Auth Card)
O formulário em si fica contido em um cartão (`.auth-card`) que usa o efeito de Glassmorphism (vidro fosco).

```css
background: rgba(30, 36, 48, 0.9);
backdrop-filter: blur(4px);
border: 1px solid var(--color-border-soft);
```
- **Backdrop-filter:** Um desfoque de `4px` cria uma separação visual elegante entre o cartão e a imagem de fundo detalhada.
- **Transparência:** O fundo levemente transparente do card permite que a imagem ao fundo ainda colabore com a atmosfera geral da tela, mantendo total legibilidade das fontes e botões para não afetar o uso e a simplicidade.

## Detalhes Ambientais
As telas preservam formas flutuantes (`.ambient-shape`) que são borradas por trás do conteúdo principal e as marca d'águas do sistema (`.brand-watermark`) que oferecem contexto de branding sutil, sem interferir com a arte principal.

Com essas características combinadas, as telas ganham um aspecto imersivo e atraente, sem perder o foco na funcionalidade de entrada e de criação de contas dos usuários.
