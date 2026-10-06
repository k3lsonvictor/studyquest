# StudyQuest

MVP para responsáveis organizarem atividades, aprovarem conquistas e trocarem pontos por recompensas. Next.js App Router, TypeScript estrito, Tailwind CSS e Supabase Auth/PostgreSQL. O nome fica centralizado em `lib/config.ts`.

## Explorar sem configurar o Supabase

```powershell
npm run demo
```

Abra **http://127.0.0.1:3001/login** e clique em **Explorar demonstração**. A Família Silva já vem com Lucas, matérias, atividades, 115 pontos fictícios, recompensas e solicitações para aprovar. As telas e regras de pontos são as mesmas da aplicação; apenas o serviço de autenticação é simulado localmente.

Você pode criar, editar, concluir e aprovar atividades, testar resgates e entrar no modo criança. Para voltar ao responsável, clique em **Área do responsável** e novamente em **Explorar demonstração**. Se preferir preencher o login, use `demo@studyquest.local` e `StudyQuest123!` (credenciais exclusivamente fictícias).

Os dados ficam em memória e são apagados ao encerrar/reiniciar `npm run demo`. O comando utiliza apenas o computador local, nas portas 3001 e 54339, sem alterar `.env.local`, conectar ao Supabase ou enviar e-mails. Use dados fictícios. A demonstração requer as dependências de desenvolvimento (`npm ci`) e não deve ser publicada como backend de produção.

## Executar localmente com Supabase

### Tour guiado da plataforma

O primeiro acesso apresenta um convite **Conhecer a plataforma**. Depois de iniciar ou dispensar o convite, o botão **Como funciona** permite rever o guia da tela atual. Há dicas para a configuração inicial, responsáveis, missões e recompensas infantis e personalização do avatar. O guia apenas explica a interface: não envia formulários, compra itens nem altera pontos.

A implementação utiliza [Driver.js](https://driverjs.com/docs/configuration), carregado sob demanda, com estilo próprio, progresso, Voltar, Próximo, Pular e Concluir. Aceita teclado (setas, Tab e Escape) e respeita a preferência por movimento reduzido. Elementos ausentes ou ocultos são excluídos dos passos, incluindo a navegação desktop no celular.

Não requer migration. A preferência fica no `localStorage`, separada por conta de responsável/criança e versão do guia; em outro navegador ou após limpar os dados, o convite reaparece. A configuração inicial tem seu próprio convite. Os textos e alvos ficam em `features/tour/steps.ts`, o ciclo de vida em `features/tour/product-tour.tsx` e o estilo em `features/tour/tour.css`. `tests/e2e/tour.spec.ts` cobre convite, persistência, teclado, conclusão, celular e armazenamento bloqueado.

### Atualização: cabelos do avatar

Se a loja já está instalada, execute somente `supabase/migrations/202610030002_avatar_hair.sql` no SQL Editor. Caso contrário, execute primeiro `202610030001_avatar_shop.sql` e depois a migration de cabelos. O schema completo já inclui ambas. A categoria **Cabelos** oferece longo castanho, longo dourado, chanel preto, rabo de cavalo ruivo e curto azul. Os cabelos podem ser combinados com chapéus; voltar ao cabelo curto original é grátis.

### Atualização: avatar 3D e loja de estilos

Se o projeto já tem o schema inicial, execute **somente** `supabase/migrations/202610030001_avatar_shop.sql` no SQL Editor. Essa migration preserva as crianças, atividades, recompensas e pontos existentes; adiciona catálogo, armário, equipamento e o tipo de transação `avatar`. Não execute o schema inicial novamente. Em uma instalação nova, o `schema.sql` já contém essa atualização.

No modo criança, abra **Perfil → Loja de estilos**. O avatar em blocos é um modelo original construído com Three.js, sem baixar modelos, imagens ou texturas externas. Há dez itens entre camisetas, calças, chapéus, fone, óculos e mochila. É possível girar o avatar e experimentar um item antes de decidir comprar.

- O avatar e o visual original são gratuitos.
- A compra pede confirmação, debita os pontos imediatamente e equipa o item. Não exige aprovação do responsável; essa regra se aplica apenas aos cosméticos, enquanto recompensas mantêm o fluxo de aprovação.
- Os pontos são os mesmos usados nas recompensas. Uma compra pode deixar um pedido de recompensa pendente sem saldo suficiente; a aprovação desse pedido sempre revalida o saldo.
- Cada item pode ser comprado uma vez por criança. O armário é permanente; equipar, retirar e trocar itens não gasta pontos. Não há reembolso ou transferência de itens nesta versão.
- O histórico do responsável mostra cada compra como **Loja do avatar**.
- Catálogo/preços não são editáveis pelo navegador. Compras, saldo e posse são validados no banco; a transação usa o mesmo bloqueio da criança utilizado nos resgates. RLS também protege o armário entre crianças da mesma família no modo criança.
- A visualização 3D exige WebGL2. Se indisponível, a loja continua funcional com ilustrações dos itens. A cena respeita a preferência de movimento reduzido, pausa renderizações fora da tela e libera os recursos ao sair.

O modo `npm run demo` carrega a atualização automaticamente ao reiniciar. O servidor Supabase real só disponibiliza a loja depois de aplicar a migration.

Requisitos: Node.js 22+ e um projeto Supabase novo. O desenvolvimento foi validado com Node 24.

```powershell
cd C:\Users\Kelson\Documents\Programacao\studyquest
npm ci
Copy-Item .env.example .env.local
```

Preencha `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

A chave pública legada `anon` também é aceita nesse segundo campo. **Não use uma chave `service_role`**: o aplicativo funciona com a identidade autenticada e RLS. As variáveis `NEXT_PUBLIC_*` precisam existir antes do build; após alterá-las, reinicie o servidor e reconstrua a versão de produção.

### Configurar o Supabase

1. Crie um projeto separado para o aplicativo.
2. No SQL Editor, execute `supabase/schema.sql` uma vez. Ele cria tabelas, índices, constraints, permissões, RLS e funções transacionais. Execute em seguida `supabase/seed.sql`, que instala a função opcional de exemplos (sem inserir dados automaticamente).
3. Alternativamente, aplique os arquivos em `supabase/migrations/` em ordem pelo seu fluxo Supabase CLI. Use **uma** dessas formas; não execute o schema e a migration inicial no mesmo banco.
4. Em Authentication, habilite o provedor de e-mail e senha e use senha mínima de 8 caracteres. Configure a Site URL como `http://localhost:3000` em desenvolvimento e como a URL HTTPS real na publicação.
5. Em Authentication → URL Configuration → Redirect URLs, adicione `http://localhost:3000/auth/callback` (e o equivalente HTTPS em produção). Mantenha o link padrão `{{ .ConfirmationURL }}` no template de confirmação. O cadastro envia essa URL de retorno ao Supabase; `/auth/callback` troca o código PKCE por uma sessão e abre o aplicativo. Abra o link no mesmo navegador/host utilizado no cadastro. Se o link já foi consumido ou for aberto em outro navegador, entre com e-mail e senha após a confirmação. Para produção, configure o SMTP do projeto.
6. Copie a URL e a chave publicável do projeto para `.env.local`.

```powershell
npm run dev
```

Acesse `http://localhost:3000`. Sem configuração, a landing funciona e explica como ativar a autenticação; não existe fallback silencioso para dados fictícios.

Produção:

```powershell
npm run build
npm start
```

Cookies de autenticação são HttpOnly e usam Secure em produção. Publique com HTTPS. As páginas autenticadas são dinâmicas; não configure cache público para elas.

## Fluxo principal

1. Crie a conta, confirme o e-mail se necessário e entre.
2. No onboarding, crie uma família, Lucas e a matéria Matemática. Você pode pular os passos restantes.
3. Crie uma atividade de **50 pontos**, mantendo a aprovação obrigatória.
4. Em Crianças, use **Entrar no modo criança** e conclua a missão.
5. Clique em **Área do responsável** e informe novamente e-mail e senha.
6. Aprove em Aprovações: saldo **50**.
7. Crie uma recompensa de **40 pontos**.
8. Entre novamente no modo criança, abra Recompensas e solicite o resgate.
9. Volte como responsável e aprove em Solicitações de recompensa: saldo **10**.
10. Abra a jornada da criança: o histórico contém **+50** e **−40**.

Nenhuma etapa exige manipular o banco após o setup.

## Recursos entregues

- Cadastro/login/logout com Supabase Auth; onboarding pulável e retomável.
- Família, várias crianças com nome/avatar, matérias com ícone/cor.
- Atividades com descrição, criança, matéria, prazo, pontos e aprovação opcional; filtros, edição e exclusão com confirmação.
- Aprovação/rejeição de atividades; reenvio de atividade rejeitada.
- Recompensas editáveis, ativação/desativação e aprovação/rejeição de resgates.
- Dashboard, detalhe da criança, histórico imutável e saldo derivado das transações.
- Interface separada da criança, estados vazios, carregamento, erros, sucesso e navegação inferior no celular.
- Avatar 3D original, prévia de cosméticos, compras com pontos, armário e equipamento persistente no perfil da criança.
- Seed opcional: Família Silva, Lucas, quatro matérias, três atividades e três recompensas do escopo. Disponível no onboarding antes de criar uma família. Não cria pontos artificiais.

## Regras e segurança

- Uma conta responsável administra uma família no MVP (`families.owner_id` único).
- `auth.users` é a identidade; `public.users` guarda o perfil, criado junto da família.
- Não há coluna redundante `total_points`: o saldo é a soma de `points_transactions`.
- Atividades que exigem aprovação não geram pontos no envio. Sem aprovação, geram pontos imediatamente.
- A mesma atividade só pode gerar uma transação. O banco bloqueia edições e exclusões após o envio para aprovação ou conclusão.
- Resgates são solicitados sem débito; a aprovação trava a linha da criança e confere novamente o saldo antes de debitar. Custo é preservado na solicitação. Desativar uma recompensa impede novos pedidos; pedidos existentes ainda podem ser aprovados ou rejeitados.
- Só pode existir um pedido pendente da mesma recompensa por criança. Pedidos de recompensas diferentes não reservam saldo; cada aprovação faz nova validação.
- RLS isola cada família. Chaves compostas impedem associar crianças e matérias de famílias diferentes.
- Pontos, estados de atividades e estados de resgates não podem ser alterados diretamente pelo cliente. São modificados apenas por RPCs autorizadas, com `search_path` fixo e permissões explícitas.
- Ao entrar no modo criança, o `session_id` da sessão Supabase fica restrito àquela criança no banco. Não basta mudar a URL ou remover um cookie de interface para ganhar acesso administrativo. Uma nova autenticação com senha cria uma sessão de responsável; a sessão antiga continua restrita.
- O modo criança afeta as abas que compartilham a mesma sessão. Não é uma conta independente da criança, nem um controle parental do dispositivo. Não compartilhe a senha/sessões de responsável.

## Estrutura

```text
app/                  Rotas App Router, layouts e Server Actions
  app/                Área do responsável
  kid/[childId]/      Área da criança
  login/              Cadastro e login
  onboarding/         Configuração inicial
components/           UI, navegação e formulários reutilizáveis
features/             Formulários, cards de atividades e jornada da criança
lib/                  Configuração, formatação e cliente Supabase SSR
services/             Leitura dos dados e validação de sessão
types/                Modelos compartilhados
supabase/             Schema completo, seed e migrations versionadas
tests/                SQL real em PGlite, fixture HTTP e testes de navegador
proxy.ts              Renovação dos cookies de autenticação
```

## Validação automatizada

```powershell
npm run typecheck
npm test
npm run build
npm run test:e2e
```

`npm test` executa o schema real no PostgreSQL embarcado PGlite. Verifica fluxo 50 → 10, duplicidade, rejeição/reenvio, aprovação automática, saldo insuficiente, custo preservado, rollback, RLS entre famílias, referências cruzadas, escrita direta proibida, modo criança e seed.

Os testes do avatar cobrem compra única, débito e equipamento atômicos, troca gratuita, item inativo, tentativa de equipar sem possuir, isolamento entre famílias/irmãos, uso dos mesmos pontos de recompensas e aplicação das migrations em um banco anterior. O Playwright também testa renderização 3D, prévia/cancelamento, compra, persistência após recarregar, histórico e layout mobile. WebGL utiliza o renderizador de software somente no navegador de testes.

O teste E2E usa Playwright com Microsoft Edge instalado. Em outro sistema, instale o Chromium do Playwright e selecione o canal:

```powershell
npx playwright install chromium
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm run test:e2e
```

O teste inicia servidores exclusivos nas portas 3100 e 54329, percorre a interface completa e gera screenshots em `test-results/`. **A autenticação e o protocolo HTTP do Supabase são simulados nesse teste; as regras e as políticas de banco executam o SQL real.** A fixture está isolada em `tests/`, usa usuários descartáveis e não integra a aplicação de produção. Não a utilize como backend real.

PGlite usa uma conexão: os testes verificam as proteções transacionais e a repetição de operações, mas não representam um teste de carga com conexões PostgreSQL concorrentes. Antes de publicar, repita o fluxo no projeto Supabase real para validar Auth hospedado, confirmação de e-mail, renovação da sessão e concorrência na infraestrutura final.

## Limitações e próximos passos

- Sem pagamentos, escolas, IA, chat, push, ranking ou loja real, conforme o escopo.
- Sem recuperação de senha pela interface, convite de outro responsável, recorrência de atividades ou comprovantes de entrega da recompensa.
- Listagens carregam os dados visíveis da família em lotes, sem truncar o histórico pelo limite de linhas da API. Para históricos longos, adicionar paginação na interface e agregação de saldo no servidor para reduzir o volume transferido.
- Logs de modo criança são preservados; em uma operação de longo prazo, criar limpeza de sessões expiradas considerando a política de expiração do Auth.
- Próximos passos: validação em Supabase hospedado, implantação HTTPS, recuperação de senha, paginação e testes de concorrência com múltiplas conexões.

Referências utilizadas: [Next.js App Router](https://nextjs.org/docs/app/getting-started/installation) e [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
# studyquest
