# Lendas do DC Design System

> Versão inicial: 0.1 · Produto: mensagens anônimas · Idioma de interface: `pt-BR`

## 0. Research Log

- **Embedded references:** shortlist de referências de produto editorial, mídia noturna e interface minimalista; selecionada a referência de mídia editorial pela gramática de colunas, títulos fortes e regras finas. Nenhum logo, fonte, texto, cor ou token foi copiado.
- **UI/UX database:** consultas para `anonymous messaging dark editorial content-first` e `dark editorial accessible typography`; aproveitados somente os princípios de conteúdo primeiro, grade assimétrica, contraste e estados visíveis.
- **Web research:** consultadas fontes do W3C, MDN, SERPRO, Nielsen Norman Group, CSS Color 4 e estudos brasileiros de tipografia digital.
- **Lazyweb and image drafts:** não aplicáveis ao entregável documental; não foram usadas telas externas nem imagens de referência.

## 1. Project Identity

### Identidade

- **Nome:** Lendas do DC
- **Tagline:** Uma plataforma de mensagens anônimas
- **Atmosfera:** Mural editorial noturno
- **Idioma:** Português brasileiro (`pt-BR`), com acentuação e pontuação preservadas

Lendas do DC deve parecer um mural de bairro depois do expediente: escuro, legível, direto e cheio de pequenas vozes. A interface não dramatiza a intimidade das mensagens com efeitos chamativos; ela cria um palco silencioso para que o conteúdo seja lido e publicado com segurança.

### Princípios de design

1. **Contenção editorial:** hierarquia tipográfica, ritmo e regras estruturais fazem o trabalho visual. Cor, sombra e movimento são recursos escassos.
2. **Segurança anônima:** o sistema nunca transforma identidade opcional em espetáculo. Privacidade, moderação e confirmação de ação devem ser compreensíveis antes de serem bonitas.
3. **Escuridão acessível:** a aparência noturna não pode depender de cinza frágil, foco invisível ou texto sobre textura. Toda superfície tem par semântico testado.
4. **Voz antes do ornamento:** mensagens, avisos e estados vazios recebem largura, contraste e respiro adequados para leitura contínua.

### Assinatura visual

O elemento reconhecível é a **faixa de mural**: blocos de conteúdo com uma etiqueta editorial curta, uma regra horizontal e uma superfície tonal levemente diferente. A faixa orienta sem virar banner; ela pode carregar categoria, horário, moderação ou contexto.

### Fora do escopo visual

Não usar gradientes decorativos, brilho neon, glassmorphism, ilustrações de banco, fundos fotográficos atrás de texto, cantos arredondados como linguagem dominante ou layouts de SaaS com três cartões iguais. O vermelho é semântico e editorial, não uma cor de preenchimento constante.

## 2. Color System

### Princípios de cor

O sistema tem duas camadas: rampas primitivas e tokens semânticos. Componentes devem consumir tokens semânticos; rampas ficam para composição de tokens e para swatches de documentação. As rampas usam `oklch(L C H)`: `L` organiza luminosidade percebida, `C` controla intensidade e `H` mantém a família cromática. Os valores foram escolhidos para sRGB como fallback e devem ser rechecados após composição, alpha ou imagem.

As diferenças entre superfícies são tonais e intencionais, não promessas de contraste de texto. WCAG é aplicado aos pares que carregam informação: texto, limites de controles, ícones, foco e estados. Uma superfície pode ser visualmente distinta da vizinha com razão menor que 3:1 quando outra borda, estrutura ou etiqueta já comunica o limite; controles e indicadores que dependem do limite usam os tokens de borda aprovados abaixo.

### Rampas primárias: preto e carvão

| Token | OKLCH | Fallback hex | Par de contraste aprovado | Uso |
|---|---|---:|---|---|
| `--color-black` | `oklch(0% 0 0)` | `#000000` | `--color-text-primary` sobre preto: **13.75:1** | Tela-base, scrim, faixa editorial de maior ênfase |
| `--color-charcoal-900` | `oklch(12% 0.012 270)` | `#04060A` | `--color-text-primary` sobre 900: **13.27:1** | Fundo profundo e áreas sem conteúdo |
| `--color-charcoal-800` | `oklch(17% 0.014 270)` | `#0D0F16` | `--color-text-primary` sobre 800: **12.53:1** | Superfície principal do mural |
| `--color-charcoal-700` | `oklch(23% 0.016 270)` | `#1A1D25` | `--color-text-primary` sobre 700: **11.03:1** | Cartão e superfície elevada |
| `--color-charcoal-600` | `oklch(30% 0.018 270)` | `#2A2E37` | `--color-text-primary` sobre 600: **8.90:1** | Campo agrupado, hover tonal |
| `--color-charcoal-500` | `oklch(38% 0.020 270)` | `#3E424D` | `--color-text-primary` sobre 500: **6.57:1** | Regra forte, estado pressed em superfície |
| `--color-charcoal-400` | `oklch(46% 0.018 270)` | `#545862` | `--color-text-primary` sobre 400: **4.66:1** | Texto auxiliar quando necessário, outline de controle |
| `--color-charcoal-300` | `oklch(60% 0.016 270)` | `#7C808A` | Sobre `--color-surface`: **4.84:1** | Borda padrão e divisores que precisam de 3:1 |
| `--color-charcoal-200` | `oklch(72% 0.014 270)` | `#A1A4AE` | Sobre `--color-surface`: **6.67:1** | Borda forte, placeholder aprovado apenas em contexto validado |
| `--color-charcoal-100` | `oklch(86% 0.012 270)` | `#CED1D9` | Sobre `--color-surface`: **12.53:1** | Texto primário, títulos e dados essenciais |

Os nove passos de carvão são visualmente distintos por luminosidade e baixa cromaticidade. `charcoal-100` não é usado como texto sobre `charcoal-100`; `charcoal-300` e `charcoal-200` são limites, não corpo de texto. Para qualquer novo par, medir a cor renderizada, não inferir a partir de `L`.

### Rampa semântica vermelha

| Token | OKLCH | Fallback hex | Par de contraste aprovado | Uso |
|---|---|---:|---|---|
| `--color-red-500` | `oklch(62% 0.20 25)` | `#E64343` | Sobre `--color-surface`: **4.78:1**; preto sobre red-500: **5.25:1** | Erro inline, link de denúncia, destaque de ação destrutiva |
| `--color-red-600` | `oklch(53% 0.18 25)` | `#BE2E31` | Preto sobre red-600: **3.62:1** (somente texto grande/controle definido) | Hover de destruição, nunca corpo de texto |
| `--color-red-700` | `oklch(44% 0.15 25)` | `#942124` | Texto primário sobre red-700: **3.40:1** (somente texto grande) | Separador forte ou preenchimento contextual |
| `--color-red-800` | `oklch(35% 0.12 25)` | `#6C1517` | Texto primário sobre red-800: **5.54:1** | Container de erro, alerta persistente |
| `--color-red-900` | `oklch(27% 0.09 25)` | `#490D0E` | Texto primário sobre red-900: **7.80:1** | Tintura de superfície de erro e estado crítico discreto |

Vermelho nunca é a única pista: erro e destruição também usam texto explícito, ícone ou padrão de composição. Não usar red-600 ou red-700 como cor de corpo de texto. A ação destrutiva padrão usa red-500 com texto preto, pois essa dupla excede 4.5:1.

### Cores semânticas complementares

| Token | OKLCH | Fallback hex | Par de contraste aprovado | Uso |
|---|---|---:|---|---|
| `--color-green-500` | `oklch(68% 0.17 150)` | `#2EB45C` | Preto sobre green-500: **7.80:1**; green-500 sobre surface: **7.11:1** | Confirmação de publicação, sucesso de moderação |
| `--color-amber-500` | `oklch(78% 0.16 75)` | `#F2A618` | Preto sobre amber-500: **10.24:1**; amber-500 sobre surface: **9.34:1** | Atenção, ação reversível, aviso de privacidade |

Verde e âmbar são estados, não decoração. Para ambos, usar texto preto em preenchimentos fortes e a própria cor como texto somente nos pares aprovados com superfície escura.

### Tokens semânticos

| Token | Valor | Par de contraste | Uso |
|---|---|---|---|
| `--color-surface` | `var(--color-charcoal-800)` | Texto primário: **12.53:1** | Fundo de página e leitura principal |
| `--color-surface-elevated` | `var(--color-charcoal-700)` | Texto primário: **11.03:1** | Cartões, menus, diálogos e popovers |
| `--color-text-primary` | `var(--color-charcoal-100)` | Sobre surface: **12.53:1** | Mensagem, título, label e conteúdo essencial |
| `--color-text-secondary` | `var(--color-charcoal-200)` | Sobre surface: **8.44:1** | Metadados, ajuda e contexto; não usar para conteúdo obrigatório |
| `--color-text-inverse` | `var(--color-black)` | Sobre red-500: **5.25:1** | Texto em preenchimentos vermelho, verde ou âmbar aprovados |
| `--color-border` | `var(--color-charcoal-300)` | Sobre surface: **4.84:1** | Limite padrão de inputs, cartões e separadores importantes |
| `--color-border-strong` | `var(--color-charcoal-200)` | Sobre surface: **6.67:1** | Foco, seleção, destaque e limite de alta prioridade |
| `--color-focus` | `var(--color-charcoal-100)` com halo `red-500` | Pelo menos **3:1** contra ambos os estados adjacentes | Indicador de foco de teclado, sempre com 2px visíveis |

### Regras de composição

- O fallback hex vem antes do `oklch()` quando uma declaração precisar suportar navegadores sem OKLCH: `background: #0D0F16; background: oklch(17% 0.014 270);`.
- Não aplicar transparência a texto, borda, foco ou estados sem medir o resultado composto.
- Não colocar texto diretamente sobre imagem, textura ou ruído. Usar superfície sólida ou scrim opaco e medir o pior ponto.
- O contraste é recalculado para hover, pressed, disabled, erro, sucesso e foco em cada superfície onde o componente aparecer.

## 3. Typography

### Família

Usar somente uma pilha de sistema, sem download, licença ou dependência tipográfica externa:

```css
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

A pilha é deliberadamente não proprietária no projeto: cada plataforma usa a fonte de sistema disponível. Não adicionar fontes remotas, `next/font` ou fontes de marca sem uma decisão registrada. A fonte deve ser testada com `á à â ã é ê í ó ô õ ú ü ç`, aspas, travessões e nomes próprios brasileiros.

### Escala modular

A escala usa uma razão editorial aproximada de 1.25, mas mantém os tamanhos exigidos pelo produto para preservar previsibilidade:

| Token | Valor | Peso padrão | Entrelinha | Uso |
|---|---:|---:|---:|---|
| `--text-xs` | `0.75rem` / 12px | 500 | 1.4 | Metadado curto, nunca instrução essencial |
| `--text-sm` | `0.875rem` / 14px | 400/500 | 1.5 | Ajuda, navegação secundária |
| `--text-base` | `1rem` / 16px | 400 | 1.5 | Corpo padrão e campos |
| `--text-lg` | `1.125rem` / 18px | 400/500 | 1.5 | Lead, chamada e mensagem destacada |
| `--text-xl` | `1.25rem` / 20px | 600 | 1.2 | Título de cartão |
| `--text-2xl` | `1.5rem` / 24px | 600 | 1.2 | Título de seção |
| `--text-3xl` | `1.875rem` / 30px | 700 | 1.2 | Título de página |
| `--text-4xl` | `2.25rem` / 36px | 700 | 1.2 | Abertura editorial, com `clamp()` responsivo |

Pesos permitidos: **400 normal**, **500 medium**, **600 semibold**, **700 bold**. Corpo nunca fica abaixo de 16px no fluxo principal. `xs` e `sm` são auxiliares e não podem carregar sozinhos uma instrução, erro ou prazo.

### Regras editoriais

- Corpo usa `line-height: 1.5`; títulos usam `line-height: 1.2`.
- Texto corrido fica entre 45 e 75 caracteres por linha, com preferência por 60–70 em desktop. Mensagens longas usam uma coluna única e nunca ocupam a largura completa do monitor.
- Alinhamento padrão é à esquerda. Não justificar mensagens sem teste de hifenização e espaçamento.
- Caixa alta fica restrita a etiquetas curtas; acentos e cedilhas devem permanecer corretos.
- `lang="pt-BR"` é obrigatório no documento. Usar `hyphens: auto` apenas em blocos que foram testados em navegadores alvo.
- Não usar tracking negativo no corpo. Tracking positivo em etiquetas deve ser pequeno e nunca separar acentos de suas letras.
- Respeitar zoom de 200% e aumento de texto sem corte ou sobreposição.

## 4. Spacing System

### Grade base

Toda medida de espaçamento, gap, padding, margem interna e raio deriva de **4px**. O número do passo é o multiplicador do valor base.

| Token | Passo | Valor | Uso |
|---|---:|---:|---|
| `--space-0` | 0 | 0px | Reset, separação deliberadamente nula |
| `--space-1` | 1 | 4px | Ícone-label, etiqueta-título |
| `--space-2` | 2 | 8px | Grupo inline, linha compacta |
| `--space-3` | 3 | 12px | Ajuda de campo, padding compacto |
| `--space-4` | 4 | 16px | Padding padrão e ritmo de parágrafo |
| `--space-5` | 5 | 20px | Campo confortável, cluster |
| `--space-6` | 6 | 24px | Gutter de grade, padding de cartão |
| `--space-8` | 8 | 32px | Separação entre grupos |
| `--space-10` | 10 | 40px | Respiro de seção |
| `--space-12` | 12 | 48px | Quebra editorial maior |
| `--space-16` | 16 | 64px | Margem de página em desktop |
| `--space-20` | 20 | 80px | Abertura de página, quando o conteúdo permitir |
| `--space-24` | 24 | 96px | Separação máxima entre capítulos |

Raios também seguem a grade: `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`. Cartões e diálogos preferem `radius-md`; não usar pílulas para ações primárias. Avatares podem ser circulares.

## 5. Breakpoints

Os breakpoints são limites de composição, não tamanhos de dispositivo presumidos. A regra é mobile-first e todo conteúdo deve caber sem rolagem horizontal.

| Token | Valor | Comportamento |
|---|---:|---|
| `--breakpoint-sm` | 640px | Mobile landscape; cluster pode ganhar segunda coluna curta |
| `--breakpoint-md` | 768px | Tablet; mural passa de uma para duas colunas quando o conteúdo permitir |
| `--breakpoint-lg` | 1024px | Desktop; grade editorial completa e navegação expandida |
| `--breakpoint-xl` | 1280px | Desktop grande; container atinge sua largura máxima |
| `--breakpoint-2xl` | 1536px | Ultra-wide; aumenta margem externa, não a medida de leitura |

Testar explicitamente em 375px, 640px, 768px, 1024px, 1280px e 1536px, além de zoom 200% e orientação landscape.

## 6. Depth and Shadows

A estratégia é **mista tonal + sombra curta**. A tonalidade vem primeiro; sombra só confirma que um elemento atravessa a camada abaixo. Não usar glow, sombra colorida ou sombra em texto.

| Nível | Token/valor | Uso |
|---|---|---|
| Level 0 | `box-shadow: none` | Tela, mural, divisores planos |
| Level 1 | `0 1px 3px rgba(0, 0, 0, 0.3)` | Cartões sobre o mural |
| Level 2 | `0 4px 12px rgba(0, 0, 0, 0.4)` | Dropdown, popover, menu |
| Level 3 | `0 8px 24px rgba(0, 0, 0, 0.5)` | Dialog e AlertDialog |

As superfícies devem seguir `surface` → `surface-elevated` → uma camada de overlay controlada. Sombras não substituem foco, borda de controle ou contraste. Em `prefers-reduced-motion`, a sombra ainda pode existir; o movimento que a acompanha não.

## 7. Motion and Animation

### Tokens

- `--duration-fast: 150ms` para hover, press e feedback imediato.
- `--duration-normal: 250ms` para abrir menus, trocar abas e atualizar estados.
- `--duration-slow: 350ms` para dialog, toast e transição de página.
- `--ease-standard: ease-in-out` para a maioria dos estados.
- `--ease-enter: cubic-bezier(0.16, 1, 0.3, 1)` para entrada de conteúdo.

### Regras

- Animar somente `transform` e `opacity`; não animar layout, largura, altura, top ou left.
- Hover e pressed devem comunicar relação causa-efeito, não decorar elementos estáticos.
- Transição de página: fade com slide vertical de no máximo 8px, em até 350ms.
- Loading: pulse discreto apenas no Skeleton ou indicador de progresso; nunca animar feedback crítico nem piscar texto essencial.
- Indicador de foco não depende de animação, nunca fica oculto durante transições e não pode ser animado como condição de visibilidade.
- Aplicar `@media (prefers-reduced-motion: reduce)` para remover slide, pulse, stagger e transições não essenciais. Conteúdo e feedback continuam disponíveis imediatamente.
- Não bloquear teclado, leitura ou ação enquanto a animação roda.

## 8. Layout Primitives

### Container

`Container` centraliza conteúdo em `max-width: 1280px`, com insets responsivos de `space-4` no mobile, `space-6` no tablet e `space-8` ou `space-10` no desktop. A medida de leitura de mensagens é menor que a medida do container.

### EditorialGrid

Grade CSS de **12 colunas** com gutter de 24px em desktop. No mobile, vira uma coluna; no tablet, duas ou seis faixas conforme o conteúdo. A composição recomendada é 7/5 ou 8/4 para destaque e contexto, não três cartões iguais.

### Stack

Fluxo vertical com `gap` escolhido na escala: `space-2` para metadados, `space-4` para campos, `space-6` para blocos e `space-10` ou `space-12` para seções.

### Cluster

Agrupamento horizontal com `gap` consistente, `flex-wrap: wrap` e alinhamento pelo centro ou baseline. Nunca depender apenas de cor para indicar que itens pertencem ao mesmo grupo.

### MuralBand

Faixa editorial com etiqueta curta, regra superior ou inferior de 1px e superfície tonal. Serve para separar uma sequência de mensagens, uma categoria ou um estado. Em mobile, a faixa não fixa conteúdo crítico sem reservar espaço para o cabeçalho.

### ReadingColumn

Coluna com `max-width: 68ch`, alinhamento à esquerda, `space-4` entre parágrafos e `space-6` entre blocos. Mensagens com links longos, nomes extensos e strings sem espaço devem quebrar sem causar overflow.

### OverlayShell

Camadas de diálogo usam um scrim sólido/semissólido, foco preso no diálogo e retorno de foco ao gatilho. A rolagem pertence ao conteúdo do diálogo apenas quando o conteúdo exceder o viewport; o `body` não deve competir por scroll.

## 9. Semantic States

Estados têm cor, texto e mudança estrutural quando necessário. Cor nunca é o único indicador.

| Estado | Mapeamento | Comportamento |
|---|---|---|
| Default | `surface` + `text-primary` + `border` | Estado de repouso; leitura sem ruído |
| Hover | `surface-elevated` ou `charcoal-600` + mesma cor de texto | Apenas elementos apontáveis; transição de 150ms |
| Active / Pressed | Um passo tonal abaixo do estado hover, ou `transform: translateY(1px)` | Feedback imediato, sem mudar layout vizinho |
| Focus | Anel de 2px com `color-focus`, halo vermelho quando necessário | Sempre visível em teclado; contraste mínimo de 3:1 contra adjacentes |
| Disabled | Opacidade visual de até 50%, `disabled`/`aria-disabled`, sem ação e sem pointer events | Não usar para conteúdo informativo; não depende só da opacidade |
| Error | Tint `red-900`, texto `red-500`, ícone e mensagem acionável | Associar ao campo com `aria-describedby`; `role=alert` apenas para erro urgente |
| Success | Tint derivada de green-500 em surface, texto green-500, confirmação textual | Confirmar o que foi concluído e o próximo passo |
| Warning | Tint derivada de amber-500 em surface, texto amber-500, ação de cuidado | Explicar risco e oferecer saída segura |
| Loading | Skeleton tonal ou progress com `aria-busy`; pulse sutil | Não alterar a estrutura final; respeitar reduced motion |

### Tokens derivados de estado

As tinturas podem ser compostas com `color-mix(in oklch, ...)`, mas devem ser verificadas no resultado renderizado. Sugestão inicial: `red-900` com 20% de `red-500` para erro, `surface-elevated` com 16% de `green-500` para sucesso e com 16% de `amber-500` para aviso. O texto permanece nos tokens aprovados.

## 10. Component Primitives

Implementação detalhada é o Todo 6. Estes contratos devem existir antes dela.

### Button

- **Props:** `variant` (`primary`, `secondary`, `destructive`, `ghost`, `link`), `size`, `disabled`, `loading`, `type`, `onClick`, `aria-label` quando não houver texto.
- **Estados:** default, hover, pressed, focus-visible, disabled, loading.
- **Anatomia:** botão nativo, label visível, ícone opcional, área mínima de 44x44px.
- **Acessibilidade:** `button` semântico, foco visível, loading anuncia estado sem trocar o nome acessível, ação destrutiva pede confirmação quando irreversível.

### Input

- **Props:** `label`, `name`, `type` (`text`, `email`, `password`, `search`), `value`, `defaultValue`, `placeholder`, `description`, `error`, `required`, `disabled`, `autoComplete`.
- **Estados:** default, hover, focus, filled, invalid, disabled, readonly.
- **Anatomia:** `label` visível, campo nativo, ajuda persistente e erro ligado por `aria-describedby`.
- **Acessibilidade:** nunca usar placeholder como label; `type` correto; erro descreve causa e correção; campo invalidado usa `aria-invalid`.

### Textarea

- **Props:** as de `Input`, mais `rows`, `maxLength`, `showCount`, `resize`.
- **Estados:** default, focus, filled, invalid, disabled, readonly, limite atingido.
- **Anatomia:** label, descrição de privacidade, área de texto, contador opcional e mensagem de erro.
- **Acessibilidade:** contador não é a única pista do limite; preservar texto digitado em erro; não bloquear colagem ou teclado.

### Select

- **Props:** `label`, `name`, `options`, `value`, `placeholder`, `description`, `error`, `required`, `disabled`.
- **Estados:** default, open, selected, focus, invalid, disabled.
- **Acessibilidade:** preferir `select` nativo quando possível; se customizado, suportar setas, Home/End, Escape e anúncio de opção selecionada.

### Dialog / AlertDialog

- **Props:** `open`, `onOpenChange`, `title`, `description`, `children`, `actions`, `initialFocus`, `destructive`.
- **Estados:** closed, entering, open, exiting, busy.
- **Acessibilidade:** `role=dialog` ou `alertdialog`, `aria-labelledby`, `aria-describedby`, foco preso, Escape quando seguro, retorno ao gatilho e scrim que não recebe foco acidental.

### Toast

- **Props:** `kind` (`default`, `success`, `warning`, `error`), `title`, `description`, `action`, `duration`, `onDismiss`.
- **Estados:** entering, visible, paused, exiting.
- **Acessibilidade:** região `aria-live="polite"` para confirmação; erro urgente pode usar `assertive`; não roubar foco; oferecer dismiss manual; duração pausável.

### Avatar

- **Props:** `src`, `alt`, `name`, `size`, `fallback`, `decorative`.
- **Estados:** image, initial fallback, loading, unavailable.
- **Acessibilidade:** imagem significativa tem `alt`; avatar decorativo usa `alt=""`; fallback de inicial nunca expõe dado sensível além do que o usuário escolheu.

### Badge

- **Props:** `tone` (`neutral`, `error`, `success`, `warning`), `children`, `icon`, `aria-label` quando o texto não for suficiente.
- **Estados:** default, selected, dismissible.
- **Acessibilidade:** não depender só de cor; texto curto e compreensível; dismiss é botão separado de 44x44px.

### Skeleton

- **Props:** `shape`, `width`, `height`, `label`.
- **Estados:** loading, resolved, failed.
- **Acessibilidade:** região que contém o skeleton declara `aria-busy`; não anunciar cada bloco; fallback textual em carregamento longo; sem pulse quando reduced motion.

### Progress

- **Props:** `value`, `max`, `label`, `indeterminate`, `tone`.
- **Estados:** determinate, indeterminate, complete, error.
- **Acessibilidade:** usar `progressbar` com valores quando determinado; label visível ou `aria-label`; não comunicar progresso apenas pelo preenchimento.

### EmptyState

- **Props:** `title`, `description`, `action`, `icon`, `compact`.
- **Estados:** first use, filtered empty, no permission.
- **Acessibilidade:** explicar por que está vazio e qual ação é possível; ordem de leitura título → contexto → ação; não usar ilustração sem descrição.

### ErrorState

- **Props:** `title`, `description`, `retry`, `details`, `severity`.
- **Estados:** recoverable, blocked, offline, retrying.
- **Acessibilidade:** mensagem acionável perto do conteúdo afetado; retry é botão; detalhes técnicos podem ser colapsáveis; preserve o caminho de retorno.

## 11. Personas

### 1. Visitante Anônimo

Pessoa que chega por um link, navega pelo mural, lê mensagens e pode enviar uma contribuição sem criar conta. Precisa entender rapidamente o que é público, o que é anônimo, como denunciar e se a mensagem foi publicada. Pode estar no celular, em baixa luz ou usando teclado.

### 2. Autor Ativo

Contribuidor recorrente que prefere publicar sem identidade ou com um apelido opcional. Precisa de um fluxo curto, confirmação clara, limites de conteúdo e confiança de que o apelido não é obrigatório. Valoriza rascunho, contagem de caracteres e recuperação de erro sem perder o texto.

### 3. Administrador

Pessoa com acesso total a configurações, moderação, auditoria e políticas. Precisa de densidade informacional controlada, ações destrutivas separadas, filtros explícitos e rastreabilidade. Não deve depender apenas de cor para priorizar ocorrências.

### 4. Moderador

Pessoa que revisa denúncias e conteúdo em fila. É uma persona futura, fora do MVP, mas o sistema deve reservar estados de denúncia, revisão, decisão e escalonamento. Precisa de atalhos de teclado, contexto da mensagem e confirmação de decisão sem ambiguidade.

## 12. WCAG 2.2 AA Constraints

- **Contraste:** mínimo de 4.5:1 para texto normal; 3:1 para texto grande (18pt regular ou 14pt bold, aproximadamente 24px ou 18.67px) e para limites/indicadores de controles. Alvo de 7:1 para texto de leitura crítica quando não aumentar custo de compreensão.
- **Foco:** foco visível em todo elemento focável, anel de pelo menos 2px e contraste mínimo de 3:1 contra o entorno. Nunca remover `outline` sem substituto equivalente.
- **Área de toque:** 44x44px como padrão do produto para todos os alvos interativos; manter espaço suficiente entre ações vizinhas.
- **Teclado:** toda função disponível por teclado; ordem de foco previsível; Escape fecha overlays quando seguro; nenhuma ação depende somente de hover, arraste ou gesto.
- **Leitor de tela:** HTML semântico, landmarks, headings em ordem, labels visíveis, `aria-describedby` para ajuda/erro e nomes acessíveis para controles sem texto.
- **Movimento:** respeitar `prefers-reduced-motion`; conteúdo crítico não pode depender de animação; não usar flash ou piscada que possa causar desconforto.
- **Links:** não depender somente de cor; usar sublinhado ou outro indicador persistente em texto corrido.
- **Formulários:** erros próximos ao campo e em resumo quando houver vários; foco no primeiro erro após submissão; nunca apagar entrada válida.
- **Imagens:** `alt` descritivo quando informativa e vazio quando decorativa. Conteúdo gerado pelo usuário precisa de alternativa textual quando houver mídia.
- **Zoom e reflow:** operar em 200% de zoom sem perda de conteúdo, sobreposição ou rolagem horizontal de leitura.
- **Skip links:** todas as páginas têm link “Pular para o conteúdo principal” antes da navegação.
- **Idioma:** `<html lang="pt-BR">`; trechos em outro idioma recebem marcação de idioma própria.
- **Cor e significado:** erro, sucesso, aviso e seleção usam texto, ícone, posição ou padrão além da cor.
- **Conteúdo:** linguagem direta, parágrafos curtos, títulos semânticos e limite de linha adequado a português brasileiro.

## 13. Accessibility Checklist

- [ ] Todo texto passa pelo par de contraste correspondente.
- [ ] Todo controle visual tem limite ou preenchimento com contraste mínimo de 3:1 quando necessário.
- [ ] Todo elemento interativo tem foco visível e utilizável por teclado.
- [ ] Todas as imagens têm `alt` correto, inclusive imagens geradas por usuários.
- [ ] Todos os campos têm labels visíveis, descrição e erro associados.
- [ ] Todas as páginas têm skip link e landmarks semânticos.
- [ ] Todas as animações respeitam `prefers-reduced-motion`.
- [ ] Todos os alvos de toque têm pelo menos 44x44px.
- [ ] Todo conteúdo e toda ação são acessíveis por teclado.
- [ ] Erro, sucesso, aviso e seleção não dependem apenas de cor.
- [ ] Layout reflow funciona em 200% de zoom e 375px de largura.
- [ ] Texto brasileiro foi testado com acentos, cedilha, caixa alta e pontuação.
- [ ] Dialogs devolvem o foco ao gatilho e não deixam foco escapar.
- [ ] Toasts não roubam foco e são anunciados no nível correto.

## 14. Accepted Debt Register

| Débito | Localização | Por que aceito agora | Saída esperada |
|---|---|---|---|
| Fontes de sistema apenas | Fundação tipográfica | Reduz dependências, download e risco de licença no lançamento | Reavaliar após testes reais de leitura e métricas de português |
| Ícones da biblioteca Phosphor Icons | Primitivas futuras | A biblioteca atende o MVP sem criar SVGs proprietários; padronizar peso e tamanho | Auditar contraste, licença e consistência antes do showcase do Todo 6 |
| Sem alternância claro/escuro | Tema global | O produto estreia como experiência noturna intencional | Reabrir somente com pesquisa de preferência e pares de contraste para tema claro |
| Sem suporte RTL | Layout e conteúdo | O escopo é português brasileiro e não há conteúdo RTL planejado | Adicionar quando houver requisito de idioma e revisar espelhamento de ícones |
| Sem estilos de impressão | Folhas de estilo | O MVP é uma experiência digital de mural | Criar quando exportação, moderação ou arquivo impresso virar caso de uso |
| Referências de ícone ainda não instaladas | Todo 6 | Esta entrega documenta contratos, não implementa componentes | Instalar e validar a biblioteca escolhida no showcase de primitivas |

Débitos não podem justificar falha de contraste, foco, teclado, privacidade ou leitura. Novos débitos entram aqui no momento da decisão, com localização e condição de saída.

## 15. Research Log

### Referências de design editorial e produto

- **Design editorial acessível:** [Toma Aí Um Poema — legibilidade, contraste e escolhas inclusivas](https://tomaaiumpoema.com.br/design-editorial-acessivel-legibilidade-contraste-e-escolhas-inclusivas/). Reforçou que tamanho, entrelinha, largura da coluna, margens e hierarquia são decisões estruturais de leitura, não acabamento.
- **Formatação de texto longo:** [Nielsen Norman Group — Formatting Web Content](https://www.nngroup.com/articles/formatting-long-form-content/) e [Chunking](https://www.nngroup.com/articles/chunking/). Orientaram blocos curtos, títulos escaneáveis, hierarquia explícita e medida de leitura controlada.
- **Referência de estilo incorporada:** a referência editorial de mídia do acervo local foi usada somente para estudar regras finas, kickers, colunas e densidade. O projeto substitui fonte proprietária, cor de link, dimensões e componentes por tokens próprios.
- **Consulta de padrões modernos:** a base UI/UX local retornou padrões de grade editorial, dark mode OLED, superfícies tonais e inclusão. Foram rejeitados os gradientes, neon, glassmorphism, fontes remotas e valores copiados.

### OKLCH e rampas

- **MDN — `oklch()` CSS:** [CSS color value: oklch](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/oklch). Consultado via Context7 para confirmar a sintaxe `oklch(L C H)`, o papel de luminosidade/chroma/hue e o uso de valores relativos.
- **W3C CSS Color 4:** [OKLab e OKLCH](https://www.w3.org/TR/css-color-4/#ok-lab) e [gamut mapping](https://www.w3.org/TR/css-color-4/#gamut-mapping). Orientaram variar `L` para construir a rampa, reduzir `C` nos extremos e validar o resultado no gamut de entrega.
- **Sistema tonal moderno:** [Tonal UI](https://github.com/Seungwoo321/tonal-ui) e [Aura Design System — color foundations](https://docs.cognite.com/aura-design-system/foundations/color). Foram consultados como exemplos de separação entre rampa e token semântico; nenhum token, nome ou valor foi adotado.

### WCAG 2.2 e acessibilidade

- **W3C WCAG 2.2:** [recomendação em inglês](https://www.w3.org/TR/WCAG22/) e [tradução brasileira](https://www.w3.org/Translations/WCAG22-pt-BR-20250327/). Confirmaram os princípios perceptível, operável, compreensível e robusto, além dos níveis de conformidade.
- **Contraste mínimo:** [Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum) confirmou 4.5:1 para texto normal e 3:1 para texto grande.
- **Contraste não textual:** [Understanding SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) confirmou 3:1 para limites, estados e objetos gráficos necessários.
- **Norma brasileira:** [ABNT NBR 17225 — referência pública](https://mwpt.com.br/wp-content/uploads/2025/04/ABNT-NBR-17225-Acessibilidade-Digital.pdf). A consulta reforçou foco visível, semântica de headings, landmarks, teclado e área de acionamento.

### Tipografia em português brasileiro

- **Padrão Digital de Governo — Tipografia:** [SERPRO](https://next-ds.estaleiro.serpro.gov.br/fundamentos/tipografia?visao-geral=). Orientou base de 16px, 150% para corpo, 120% para cabeçalhos, escala consistente, cautela com tracking e linhas de aproximadamente 60–80 caracteres.
- **Estudo de publicações digitais:** [Fatores de aplicação da tipografia em publicações digitais](https://doi.org/10.5151/cidi2017-106). Reforçou contraste, otimização de fonte para tela, flexibilidade entre pesos, comprimento de linha e consistência como fatores de leitura.
- **Idioma da página:** [W3C — declarações de idioma em HTML](https://www.w3.org/International/questions/qa-html-language-declarations.pt-br) e [CSS Text](https://www.w3.org/TR/css-text-3/). Orientaram `lang="pt-BR"`, hifenização controlada e teste de diacríticos.

### Decisões derivadas da pesquisa

1. A atmosfera noturna será construída por camadas de carvão, regras e tipografia, não por gradiente.
2. A cor vermelha ficará concentrada em denúncia, erro e destruição; status verde e âmbar existirão apenas como feedback.
3. Contraste será documentado por par semântico e testado após composição, incluindo estados, e não apenas por swatches.
4. A leitura de mensagens terá measure limitada, entrelinha confortável e conteúdo em português real antes da aprovação visual.
5. O acervo consultado informa princípios, não identidade: Lendas do DC mantém nomes, valores, tokens, cópia e decisões originais.
