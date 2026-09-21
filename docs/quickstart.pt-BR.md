# Quickstart em português

Este guia é a porta de entrada do `context-spec-develop`. As políticas e contratos canônicos estão em inglês; use os links indicados para consultar a fonte original.

## 1. Instale o kit

Instale o pacote publicado:

```bash
npx @owlcodium/context-spec-develop install
```

Por padrão a instalação é global. Use `--scope project` para versionar a skill no repositório e `--agents codex,claude-code,cursor,copilot,gemini,opencode` para selecionar os harnesses sem o assistente interativo. O instalador cria lockfile, recusa conflitos sem `--force` explícito e oferece `update`, `remove` e `doctor`.

## 2. Primeira vez: inicialize o contexto do projeto

Ative `/csd` (ou `$csd` no Codex) e peça, em linguagem natural:

```text
Inicialize o context-spec-develop neste projeto.
```

A skill mostra primeiro uma prévia do bootstrap. Após uma confirmação, materializa `.context/` e uma integração idempotente no `AGENTS.md`; depois segue o contrato canônico [`initialize-project.md`](../.context/prompts/initialize-project.md):

- inspeciona o repositório (linguagens, frameworks, testes, CI, estrutura);
- preenche o contexto descobrível em [`.context/project/`](../.context/project/) e `.context/config.json`;
- marca ausências como `NOT FOUND`;
- pergunta somente decisões materiais que não pode descobrir (por exemplo, quem aprova produção);
- valida a instalação.

Preencher os arquivos manualmente continua sendo um caminho válido. O passo é idempotente: fatos confirmados são preservados e fatos organizacionais pertencem a humanos, nunca são inferados.

## 3. Uso diário: descreva o resultado

Depois de inicializado, basta descrever o trabalho:

```text
Adicione filtro por status ao endpoint de pedidos.
```

Quando o harness segue o `AGENTS.md`, cada solicitação entra automaticamente pela porta da frente: bootstrap mínimo → classificação → roteamento determinístico → roteamento de contexto → workflow. Você nunca precisa escrever "classifique isso", "use context routing" ou "otimize tokens". Depois da porta da frente, o agente resolve o resto sob demanda: escolhas explícitas e preferências registradas são reutilizadas, defaults seguros são aplicados, decisões irrelevantes para a fase são adiadas, e só perguntas materiais não resolvidas chegam a você. Uma tarefa normal não pergunta perfil nem modo de Git.

O modo de Git (`confirm_each` pergunta antes do commit e antes do push; `automatic` executa ambos somente depois dos gates, no work item, branch e remoto registrados) é resolvido apenas quando a finalização Git se torna relevante — nunca interpretado por ausência: modo não resolvido não autoriza nada. Se você já declarou uma preferência, ela é reutilizada.

## 4. Escolha Product ou Support

O agente classifica na intake; você confirma apenas o que mudar a decisão:

- **Product / feature:** novo valor, hipótese ou melhoria mensurável; começa em `discovery.md`.
- **Support / bug:** defeito reproduzível sem indisponibilidade ativa; começa em `triage.md` e `reproduction.md`.
- **Support / incident:** degradação ou indisponibilidade ativa; contenção e comunicação vêm antes da mudança permanente.
- **Support / hotfix:** correção urgente; exige rollback, teste direcionado, aprovação e observação.

Se a classificação alterar o risco ou o fluxo, o agente deve perguntar antes de criar o item.

## 5. Perfis e responsabilidades

Os perfis em [`.context/profiles/`](../.context/profiles/) definem a lente de colaboração — nunca classificação, roteamento ou autoridade. A resolução é lazy: escolha explícita ou preferência registrada é reutilizada; sem isso, aplica-se o default configurado (`agent_profiles.default`), informado brevemente; o agente só pergunta de perfil quando nenhum default atende ou a escolha muda materialmente a colaboração. Quem orquestra, planeja, executa e revisa é configurado em [`.context/orchestration/config.json`](../.context/orchestration/config.json); overrides de papel só entram quando você pede ou uma atribuição é inválida.

O agente dividirá o trabalho em subtasks pequenas, organizará waves dependentes e integrará os resultados. Subagents recebem somente o contexto necessário e não aprovam produção.

## 6. Gates e validação

O caminho comum é Specify → Plan → Preflight → Execute/Test → Verify/Review → Release → Observe/Close. O validador verifica estrutura, estados, artefatos, links, placeholders, políticas, assignments e exemplos:

```bash
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests
```

O validador não substitui testes, análise estática ou revisão técnica. Registre o comando exato, escopo, exit code e limitações nos artefatos.

## 7. Git no encerramento

Depois de todas as validações, o agente mostra o resumo e sugere uma mensagem Conventional Commit. Em `confirm_each`, pergunta separadamente se pode executar o commit e depois o push. Em `automatic`, executa ambos conforme a autorização registrada no início. Force push, reset destrutivo e deploy automático não fazem parte do kit.

Leia a política em [`review-release.md`](../.context/policies/core/review-release.md) e o contrato de encerramento em [`close.md`](../.context/prompts/close.md).

## Problemas comuns

- `NOT FOUND` em Starter é um aviso; em Managed/Enterprise, configure os comandos e limites do projeto.
- Placeholder em um work item real indica que o gate ainda não está pronto.
- Um revisor rejeitou o item? Corrija somente os achados registrados e retorne ao gate apropriado.
- Uma ferramenta opcional não está instalada? Use o fallback nativo e registre a evidência; RTK, AI-memory e review graph nunca são obrigatórios.
- Reexecutar a inicialização não destrói contexto válido: fatos confirmados são preservados; conflitos são reportados, não sobrescritos.
