# Quickstart em português

Este guia é a porta de entrada do `context-spec-develop`. As políticas e contratos canônicos estão em inglês; use os links indicados para consultar a fonte original.

## 1. Instale o kit

Use o repositório como template do GitHub ou copie-o para o projeto:

```bash
git clone https://github.com/yanpenalva/context-spec-develop.git
cd context-spec-develop
python3 scripts/validate_context.py --strict --examples
```

Preencha os arquivos em [`.context/project/`](../.context/project/). Não crie work items manualmente: a conversa inicial cria o diretório e copia os templates.

## 2. Primeira mensagem para o agente

```text
Leia AGENTS.md e inicie o fluxo context-spec-develop.
Faça somente as perguntas iniciais que estiverem faltando, escolha comigo o perfil,
orquestrador, planejador, executor e revisor, classifique Product ou Support,
crie o work item automaticamente e não altere código antes do preflight aprovado.
Converse em português, mas mantenha os artefatos canônicos em inglês.
```

O agente deve ler `AGENTS.md`, `.context/INDEX.md`, `.context/config.json` e a configuração de orquestração antes de perguntar. Consulte o contrato completo em [`docs/agent-orchestration.md`](agent-orchestration.md) e o prompt canônico em [`start-conversation.md`](../.context/prompts/start-conversation.md).

Na mesma abertura, escolha o modo de Git: `confirm_each` pergunta antes do commit e antes do push; `automatic` executa ambos somente depois dos gates, no work item, branch e remoto registrados.

## 3. Escolha Product ou Support

- **Product / feature:** novo valor, hipótese ou melhoria mensurável; começa em `discovery.md`.
- **Support / bug:** defeito reproduzível sem indisponibilidade ativa; começa em `triage.md` e `reproduction.md`.
- **Support / incident:** degradação ou indisponibilidade ativa; contenção e comunicação vêm antes da mudança permanente.
- **Support / hotfix:** correção urgente; exige rollback, teste direcionado, aprovação e observação.

Se a classificação alterar o risco ou o fluxo, o agente deve perguntar antes de criar o item.

## 4. Perfis e responsabilidades

Escolha os perfis em [`.context/profiles/`](../.context/profiles/). Eles definem a lente de perguntas, não o programa que executa o trabalho. Quem orquestra, planeja, executa e revisa é configurado em [`.context/orchestration/config.json`](../.context/orchestration/config.json).

O agente dividirá o trabalho em subtasks pequenas, organizará waves dependentes e integrará os resultados. Subagents recebem somente o contexto necessário e não aprovam produção.

## 5. Gates e validação

O caminho comum é Specify → Plan → Preflight → Execute/Test → Verify/Review → Release → Observe/Close. O validador verifica estrutura, estados, artefatos, links, placeholders, políticas, assignments e exemplos:

```bash
python3 scripts/validate_context.py --strict --examples
python3 -m unittest discover -s tests
```

O validador não substitui testes, análise estática ou revisão técnica. Registre o comando exato, escopo, exit code e limitações nos artefatos.

## 6. Git no encerramento

Depois de todas as validações, o agente mostra o resumo e sugere uma mensagem Conventional Commit. Em `confirm_each`, pergunta separadamente se pode executar o commit e depois o push. Em `automatic`, executa ambos conforme a autorização registrada no início. Force push, reset destrutivo e deploy automático não fazem parte do kit.

Leia a política em [`review-release.md`](../.context/policies/core/review-release.md) e o contrato de encerramento em [`close.md`](../.context/prompts/close.md).

## Problemas comuns

- `NOT FOUND` em Starter é um aviso; em Managed/Enterprise, configure os comandos e limites do projeto.
- Placeholder em um work item real indica que o gate ainda não está pronto.
- Um revisor rejeitou o item? Corrija somente os achados registrados e retorne ao gate apropriado.
- Uma ferramenta opcional não está instalada? Use o fallback nativo e registre a evidência; RTK, Caveman, AI-memory e review graph nunca são obrigatórios.
