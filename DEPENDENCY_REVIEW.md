# Revisão de dependências — 7 de outubro de 2026

## Resultado

Foram atualizadas ou alinhadas 42 dependências diretas distintas nos 18 workspaces.
As versões foram consultadas no registro do pnpm. Foram escolhidas versões estáveis,
respeitando os contratos de compatibilidade dos plugins e a proteção de idade mínima
do gerenciador. Nenhum commit, push, deploy, migração ou operação financeira foi executado.

A instalação final com lockfile congelado passou, sem scripts de instalação.
A configuração de segurança de pnpm-workspace.yaml permaneceu igual à original.

## Todas as versões alteradas

Esta tabela compara as declarações dos manifests, não apenas o que estava instalado.
Os valores com ^ continuam permitindo atualizações compatíveis; o lockfile fixa a resolução.

| Dependência | Faixas anteriores nos manifests | Faixa atual | Workspaces |
| --- | --- | --- | --- |
| @eslint/js | ^9.39.1 | ^9.39.5 | @repo/eslint-config |
| @hookform/resolvers | ^5.2.2 | ^5.9.1 | admin, students, website, @repo/ui |
| @next/eslint-plugin-next | ^15.4.6 | ^16.3.8 | @repo/eslint-config |
| @radix-ui/react-label | ^2.1.8 | ^2.1.16 | @repo/ui |
| @radix-ui/react-slot | ^1.2.4 | ^1.4.0 | @repo/ui |
| @supabase/ssr | ^0.8.0 | ^0.12.7 | admin, students, teachers |
| @supabase/supabase-js | ^2.93.3 | ^2.117.2 | admin, students, teachers, website |
| @tailwindcss/postcss | ^4.1.5 | ^4.3.3 | admin, students, teachers |
| @types/node | ^22.15.30, ^20.0.0 | ^22.20.5 | admin, students, teachers, website, @repo/datacrazy, @repo/email, @repo/payments |
| @types/react | ^19.1.0, ^18.0.0 | ^19.3.0 | admin, students, teachers, website, @repo/hooks, @repo/ui |
| @types/react-dom | ^19.1.1 | ^19.3.0 | admin, students, teachers, website |
| date-fns | ^4.1.0, ^3.6.0, ^3.0.0 | ^4.4.0 | admin, @repo/ui, @repo/utils |
| eslint | ^9.39.1, 9.39.1 | ^9.39.5 | admin, students, teachers, website, @repo/datacrazy, @repo/email, @repo/eslint-config, @repo/payments, @repo/types, @repo/ui, @repo/utils |
| eslint-config-prettier | ^10.1.1 | ^10.1.8 | @repo/eslint-config |
| eslint-plugin-only-warn | ^1.1.0 | ^1.2.1 | @repo/eslint-config |
| eslint-plugin-react | ^7.37.4 | ^7.37.5 | @repo/eslint-config |
| eslint-plugin-react-hooks | ^5.2.0 | ^7.1.1 | @repo/eslint-config |
| eslint-plugin-turbo | ^2.6.0 | ^2.11.7 | @repo/eslint-config |
| globals | ^16.5.0 | ^17.13.0 | @repo/eslint-config |
| libphonenumber-js | ^1.13.8 | ^1.13.14 | @repo/utils |
| lucide-react | ^0.563.0 | ^1.52.0 | admin, students, teachers, website, @repo/ui |
| next | 16.0.10, latest | 16.3.8 | admin, students, teachers, website, @repo/hooks, @repo/ui |
| postcss | ^8.5.3 | ^8.5.29 | admin, students, teachers, @repo/tailwind-config |
| prettier | ^3.6.0, ^3.2.5 | ^3.9.9 | sistema-redacao, @repo/prettier-config |
| prettier-plugin-tailwindcss | ^0.7.1, ^0.5.11 | ^0.8.1 | sistema-redacao, @repo/prettier-config |
| radix-ui | ^1.4.3 | ^1.7.0 | @repo/ui |
| react | ^19.2.0, ^18.0.0, ^19 | ^19.3.0 | admin, students, teachers, website, @repo/hooks, @repo/ui |
| react-avatar-editor | ^15.1.0 | ^16.0.0 | @repo/ui |
| react-day-picker | ^9.14.0 | ^10.0.2 | admin, students, teachers, @repo/ui |
| react-dom | ^19.1.0, ^18.0.0 | ^19.3.0 | admin, students, teachers, website, @repo/hooks |
| react-hook-form | ^7.75.0 | ^7.89.0 | admin, students, website, @repo/ui |
| recharts | ^3.7.0 | ^3.10.1 | admin, students |
| resend | ^6.17.2 | ^6.32.0 | students |
| sonner | ^2.0.7 | ^2.0.8 | admin, students, teachers, @repo/ui |
| supabase | ^2.111.0 | 2.119.0 | sistema-redacao |
| tailwind-merge | ^3.4.0 | ^3.7.0 | @repo/ui |
| tailwindcss | ^4.1.5 | ^4.3.3 | admin, students, teachers, website, @repo/tailwind-config, @repo/ui |
| turbo | ^2.7.6 | ^2.11.7 | sistema-redacao |
| typescript | 5.9.2, ^5.0.0, ^5.9.2, latest | 6.0.3 | admin, students, teachers, website, @repo/constants, @repo/datacrazy, @repo/email, @repo/eslint-config, @repo/hooks, @repo/payments, @repo/ui, @repo/utils |
| typescript-eslint | ^8.39.0 | ^8.71.1 | @repo/eslint-config |
| use-debounce | ^10.1.0 | ^10.1.1 | admin, students, teachers |
| zod | ^3.25.76, ^3.24.1 | ^4.6.5 | @repo/ui, @repo/validators |

## Remoções e reorganização

- Removidos React e @types/react de @repo/constants: não há componentes, JSX ou hooks nesse pacote.
- Removido @tailwindcss/cli de @repo/ui: não há script ou chamada à CLI.
- Removido autoprefixer dos três aplicativos internos: os configs usam o plugin do Tailwind 4, sem referência a autoprefixer.
- Removido @next/eslint-plugin-next dos manifests de Admin, Students e Teachers. O plugin permanece atualizado em @repo/eslint-config, onde realmente é importado.
- Eliminada a declaração duplicada de @repo/validators em dependencies e devDependencies do Students.
- Movidos @repo/hooks e @repo/validators para dependencies nos três aplicativos internos, pois são usados pelo código da aplicação. @repo/constants também foi movido no Students.
- Adicionado @tailwindcss/postcss explicitamente ao site, que consome o mesmo config PostCSS compartilhado. É uma biblioteca já existente no monorepo, não um novo sistema de estilos.
- ReactDOM foi mantido no Professor e no site, apesar de não ter importação direta: o Next.js depende dele em execução.
- Prettier, seus plugins e as ferramentas de compilação foram mantidos: são usados por scripts/configuração, e não necessariamente por imports de componentes.

A análise procurou referências em código, configurações, scripts e imports de CSS.
Não foi feita remoção automática baseada somente em ausência de import direto.

## Duplicações

A árvore ativa tem uma única versão de React, ReactDOM, seus tipos, Next.js,
TypeScript, date-fns, Zod, Prettier e prettier-plugin-tailwindcss.
React 18 e @types/react 18 deixaram de participar da resolução ativa.

Permanecem versões transitivas diferentes de:
@eslint-community/eslint-utils, balanced-match, brace-expansion, eslint-visitor-keys,
glob-parent, globals, ignore, minimatch, picomatch, postcss e semver.
Esses pacotes são trazidos por consumidores com faixas diferentes ou versões fixadas.
Não foram forçados overrides para disfarçar duplicações legítimas.

O lockfile foi regenerado e resoluções transitivas compatíveis foram atualizadas, incluindo
nanoid, source-map-js, baseline-browser-mapping, flatted, brace-expansion, picomatch,
browserslist e @humanfs/node.

## Exceções intencionais

- ESLint e @eslint/js: 9.39.5, e não ESLint 10.12.0/@eslint/js 10.0.1.
  O plugin estável de React declara suporte somente até ESLint 9.
  A instalação avisou que ESLint 9.39.5 está depreciado; a atualização para 10 depende
  de compatibilidade do plugin, não foi forçada.
- TypeScript: 6.0.3, e não 7.0.2. typescript-eslint 8.71.1 declara suporte a TypeScript <6.1.0.
- @types/node: 22.20.5, alinhado ao mínimo Node 22 declarado pelo projeto,
  em vez de prometer APIs de Node 26 em um projeto que ainda aceita Node 22.
- Supabase CLI: 2.119.0. A 2.120.0 foi publicada durante a revisão e foi recusada
  pela janela de segurança de idade mínima. A tentativa de atualização foi desfeita,
  sem deixar exceções nessa proteção.
- O gerenciador permanece pnpm 11.10.0, conforme o contrato existente.
  Não houve atualização global do gerenciador ou do Node instalado na máquina.

O mínimo de Node em package.json passou de >=18 para >=22,
porque o SDK atualizado do Supabase exige Node 22 ou superior.

## Adaptações no código

- @repo/hooks: main/types corrigidos de index.tsx para o arquivo real index.ts;
  moduleResolution ajustado para bundler.
- @repo/constants: passou a estender a configuração TypeScript base, sem depender
  da configuração de uma biblioteca React.
- Validações de planos, onboarding, pacotes de créditos e temas:
  adaptação dos parâmetros de mensagens à API do Zod 4.
- Coerções numéricas de planos e ano do tema:
  tipos de entrada explícitos number|string e distinção entre entrada e saída validada.
- Formulários de criação/edição de planos e de temas:
  useForm/useFormContext com os tipos de entrada e saída corretos;
  retirados casts que fingiam que strings já eram números.
- Componente Form compartilhado:
  uso direto de FormProvider, sem cast antigo; FormField suporta a saída transformada.
- Calendário compartilhado: table substituído por month_grid.
  Dois filtros do Admin passaram de initialFocus para autoFocus.
  Essas são adaptações da [migração do DayPicker 10](https://daypicker.dev/upgrading).
- Rodapé do site: o ícone de marca Instagram foi substituído por SVG local,
  mantendo a referência visual, pois não é mais exportado pela versão atual do Lucide.
- Teste de e-mail: corrigido o import para a localização existente em src/essays.
- Teste de cortesia: expectativa ajustada à regra já existente de fim do dia em São Paulo.
  A função de cálculo e a regra de cancelamento não foram alteradas nesta revisão.

A [migração do Zod 4](https://zod.dev/v4/changelog) foi consultada para as adaptações.
Não foram alteradas regras de aprovação, reembolso, autenticação, banco ou webhooks.

As duas alterações de interface que já estavam pendentes antes desta revisão
(subscription-support-sheet e student-subscription-card) foram preservadas.

## Verificação

- Tipos: passaram Admin, Students, Teachers, Website e @repo/ui.
- Tipos: passaram @repo/payments, @repo/email e @repo/datacrazy.
- Compilação sem emissão: passou para hooks, constants, utils e validators.
- Testes existentes: 57 testes mjs e 61 testes TypeScript passaram, com dados locais/mocks.
- Compatibilidade Zod: 8 verificações locais adicionais passaram, cobrindo coerções,
  defaults, mensagens, validação condicional, UUIDs, senha e atualizações parciais.
  Essas verificações adicionais usaram arquivos/loader temporários, sem adicionar
  uma dependência de runner ao projeto.
- Smoke isolado: compilação Tailwind/PostCSS, renderização React+ReactDOM+DayPicker
  e renderização do Calendar compartilhado passaram.
- Lint direcionado: passaram os arquivos adaptados do Admin e o rodapé do site.
- Revisão do diff: sem erros de whitespace.

### Limitações e próximos cuidados

O lint geral não está limpo:
UI 15 avisos, Admin 9, Students 19, Teachers 3, Website 4 e Types 1.
Os comandos com limite de zero avisos falham em UI/Admin/Students/Teachers.
Há avisos em código existente, incluindo novos diagnósticos do plugin React Hooks 7
sobre efeitos, refs, pureza e APIs não compatíveis com memoização do React Compiler.
Não foram desligadas regras nem reduzido o rigor do lint para esconder os avisos.

Auditoria de produção: de 46 alertas antes da revisão para zero.
Auditoria completa: permanece 1 alerta alto em braces 3.0.3,
dependência da cadeia de ferramentas de lint. O registro consultado não publica
braces 3.0.4, que o advisory indica como corrigido:
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
Não foi aplicada uma substituição incompatível para marcar artificialmente zero alertas.

Não foram executados build completo, teste em navegador ou operações em serviços remotos.
Antes de publicação, fazer smoke em DEV de login/sessão, formulários de plano e tema,
seleção de datas, recorte de avatar e cancelamento/reembolso com mocks ou loja de testes.
As atualizações são compartilhadas pelas quatro aplicações.

