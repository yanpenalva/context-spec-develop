# context-spec-develop — Guia Executivo e Operacional

> Um agente orquestra. Agentes executam. Pessoas decidem.

Este documento apresenta, em português, como adotar o [context-spec-develop](https://github.com/yanpenalva/context-spec-develop) em equipes de Produto e Sustentação. Ele pode ser usado como material de apresentação, roteiro de piloto e guia para a primeira conversa com um agente.

A documentação normativa e técnica do repositório permanece em inglês para manter uma fonte canônica única. Sempre que este guia indicar um arquivo em inglês, leia os títulos e exemplos com tradução assistida, mas não crie uma segunda versão normativa divergente. Se a empresa precisar de uma versão local em português, crie um documento complementar que aponte para o arquivo inglês.

## 1. Problema que o kit resolve

O desenvolvimento assistido por IA acelera investigação e implementação, mas pode aumentar riscos quando:

- o pedido chega sem contexto, dono, risco ou critério de aceite;
- decisões ficam espalhadas em conversas e não chegam ao repositório;
- cada agente segue um processo diferente;
- um agente executa sem planejamento, revisão independente ou aprovação;
- testes são mencionados sem evidência real;
- incidentes são tratados como bugs comuns;
- diretórios, templates e handoffs são criados manualmente e de forma inconsistente;
- deployment, rollback e observabilidade ficam implícitos;
- o uso de IA não tem limites de dados, ferramentas, permissões e responsabilidade humana.

O kit transforma essas decisões em contexto versionado, artefatos, gates, perfis e uma configuração explícita de orquestração.

## 2. Proposta em uma frase

O usuário descreve o resultado desejado; o agente orquestrador pergunta apenas o que falta, cria o work item, seleciona o fluxo, distribui subtasks em waves, coleta evidências e encaminha cada gate para a decisão humana correta.

O kit não substitui o projeto consumidor. Stack, infraestrutura, comandos de deploy, CI, branches, regras de hospedagem e autorização de produção continuam pertencendo a cada equipe.

## 3. Como começa uma conversa

O fluxo recomendado é este:

```text
AGENTS.md
  lê configuração de orquestração
  solicita perfil conversacional
  solicita papéis, se necessário
  classifica Product ou Support
  cria diretório e templates automaticamente
  especifica e planeja
  divide em subtasks e waves
  delega execução aos agentes escolhidos
  integra evidências
  verifica, revisa e escolhe o modo de finalização Git
  confirma cada mutação ou executa Git automaticamente conforme autorização inicial
```

### 3.1 O que o usuário informa

O usuário não precisa conhecer a árvore de diretórios nem executar `mkdir` ou copiar templates. O orquestrador solicita somente as decisões que não estão definidas no JSON:

1. perfil conversacional;
2. quem orquestra, planeja, executa e revisa, caso deseje sobrescrever os defaults;
3. se o trabalho é Product ou Support;
4. tipo de trabalho;
5. título e resultado esperado;
6. owner, risco, urgência e restrições;
7. aprovações ou limites de dados relevantes.
8. preferência de finalização Git: `confirm_each` ou `automatic`.

O contrato está em [`.context/prompts/start-conversation.md`](../.context/prompts/start-conversation.md). O roteador inicial está em [`AGENTS.md`](../AGENTS.md). A visão completa da sequência está em [`docs/agent-orchestration.md`](agent-orchestration.md). Esses arquivos estão em inglês; leia-os com tradução assistida quando necessário.

### 3.2 O que o agente cria automaticamente

Depois que as decisões mínimas são confirmadas, o orquestrador:

1. deriva e confirma um ID compatível com `work_item_id_pattern`;
2. cria `.context/work/<id>/`;
3. seleciona templates comuns e do fluxo;
4. escreve `work-item.json` com perfil, track, type, owner, risco, `git_finalization_mode`, fase e status;
5. abre `discovery.md`, `triage.md`, `spec.md` ou o artefato inicial correspondente;
6. apresenta o caminho criado e a próxima pergunta do gate;
7. não sobrescreve work item existente sem confirmação;
8. não cria infraestrutura de deploy nem configuração de CI.

A configuração que autoriza essa automação está em [`.context/orchestration/config.json`](../.context/orchestration/config.json). Os valores `auto_create_work_item`, `auto_create_directories` e `auto_copy_templates` devem permanecer `true` quando a equipe adotar esse comportamento.

## 4. Perfis conversacionais

Perfil é uma lente de colaboração, não uma permissão. O perfil muda perguntas, foco e formato de investigação; não pode aprovar produção, aceitar risco ou ignorar policy.

Perfis disponíveis em [`.context/profiles/`](../.context/profiles/):

| Perfil | Quando escolher |
| --- | --- |
| `delivery-orchestrator` | Roteamento, criação automática, delegação e integração |
| `technical-planner` | Escopo, contratos, dependências, riscos e plano |
| `senior-software-engineer` | Implementação criteriosa, compatibilidade e reversibilidade |
| `product-engineer` | Discovery, valor, critérios de aceite e métricas |
| `support-incident-engineer` | Triagem, contenção, diagnóstico e postmortem |
| `devops-release-engineer` | Readiness, rollback, Git e observação pós-release |
| `quality-engineer` | Testes, regressão, gates e evidências |
| `security-privacy-reviewer` | Segurança, privacidade, IA, dependências e supply chain |

A escolha padrão e a lista disponível ficam em `agent_profiles` dentro de [`.context/config.json`](../.context/config.json). O work item registra `conversation_profile` para manter rastreabilidade.

## 5. Quem orquestra, planeja, executa e aprova

O arquivo [`.context/orchestration/config.json`](../.context/orchestration/config.json) permite configurar os papéis sem reescrever workflows ou prompts.

| Papel | Responsabilidade | Default |
| --- | --- | --- |
| `orchestrator` | Conduzir conversa, criar work item, coordenar waves e integrar agentes | Codex + `delivery-orchestrator` |
| `planner` | Produzir especificação, plano, dependências e critérios de parada | Codex + `technical-planner` |
| `executor` | Implementar e testar subtasks delimitadas | Pool de agentes + perfis técnicos |
| `reviewer` | Revisar diff, escopo, qualidade e evidências de forma independente | Codex + `quality-engineer` |
| `security_reviewer` | Revisar impacto de segurança, privacidade ou IA | Codex + `security-privacy-reviewer` |
| `release_approver` | Autorizar push, produção e ações irreversíveis | Pessoa responsável |

É possível trocar `agent`, `profile`, `actor`, `pool`, `selection` e `max_parallel`. Exemplos:

- usar Codex como orquestrador e outro agente compatível como executor;
- usar uma pessoa como planner e agentes como executores;
- limitar `max_parallel` a `1` em trabalhos sensíveis;
- exigir security reviewer para toda mudança de dados;
- manter release approver sempre humano.

Agente e perfil são conceitos diferentes: `agent` identifica a ferramenta/runtime; `profile` identifica a função de colaboração.

## 6. Escolha Product ou Support

A seleção acontece no Intake. Nunca é feita pela linguagem, framework, diretório ou preferência de implementação.

| Pergunta | Classificação | Primeiro artefato |
| --- | --- | --- |
| Estamos criando ou melhorando valor para usuário/operador? | `product / feature` | `discovery.md` |
| Existe defeito reproduzível, mas sem degradação ativa? | `support / bug` | `triage.md` + `reproduction.md` |
| Existe degradação, indisponibilidade ou impacto ativo? | `support / incident` | `triage.md` + `incident.md` |
| É necessária correção urgente para impacto ativo/crítico? | `support / hotfix` | `triage.md` + `incident.md` |

Se a resposta estiver ambígua, o agente deve perguntar se há impacto ativo agora. Contenção vem antes de correção permanente em incidentes. Incidente sem mudança de código pode fechar com evidência e postmortem; hotfix nunca elimina rollback, teste direcionado, aprovação e observação.

Regras detalhadas estão em [`workflows/product.md`](../.context/workflows/product.md), [`workflows/support.md`](../.context/workflows/support.md) e [`workflows/core.md`](../.context/workflows/core.md). Os arquivos estão em inglês; traduza durante a leitura, mantendo os termos `Product`, `Support`, `feature`, `bug`, `incident` e `hotfix` consistentes nos artefatos.

## 7. Subtasks, waves e subagents

O plano nunca deve ser uma tarefa monolítica. Antes da execução:

- dividir o trabalho em subtasks pequenas e verificáveis;
- atribuir um owner por subtask;
- declarar dependências, arquivos/bordas mutáveis, evidência de aceite e condição de parada;
- agrupar subtasks sem conflito em waves;
- limitar o contexto recebido por cada subagent;
- manter um owner de integração;
- impedir que quem implementa aprove sozinho uma mudança de alto risco.

Uma wave posterior só começa após a evidência da wave anterior. Subagents devem parar e retornar uma dúvida quando houver mudança de escopo, contrato, autorização ou dependência não prevista.

Leia [`policies/core/decomposition.md`](../.context/policies/core/decomposition.md), [`tooling/subtasks-and-waves.md`](../.context/tooling/subtasks-and-waves.md) e o template de [`plan.md`](../.context/templates/common/plan.md). Todos estão em inglês; traduza a descrição, mas preserve os termos `subtask`, `wave`, `subagent`, `owner` e `evidence` nos JSONs e tabelas para facilitar automação.

## 8. Ferramentas opcionais para economia e coordenação

As ferramentas são opcionais. O repositório continua funcionando sem elas.

| Ferramenta | Uso recomendado | Onde ler |
| --- | --- | --- |
| RTK | Reduzir ruído de shell, busca, diff e testes; nunca ocultar falhas | [`tooling/rtk.md`](../.context/tooling/rtk.md) |
| Caveman | Comprimir mensagens curtas de planejamento/status; preservar comandos, erros e decisões | [`tooling/caveman.md`](../.context/tooling/caveman.md) |
| AI-memory | Manter continuidade; promover decisões duráveis para `.context/` e nunca guardar secrets | [`tooling/ai-memory.md`](../.context/tooling/ai-memory.md) |
| Code review graph | Representar dependências, reviewers, waves e evidências | [`tooling/code-review-graph.md`](../.context/tooling/code-review-graph.md) |

Se a ferramenta não estiver instalada, registre `NOT FOUND` no contexto do projeto e use comandos padrão. Nenhuma dessas ferramentas substitui testes, validator, policy, review ou aprovação humana.

## 9. Ciclo de entrega

Todo trabalho que possa afetar usuário, dados ou produção percorre:

```text
Intake → Specify → Plan → Preflight
→ Execute/Test → Verify/Review → Release/Deploy
→ Observe → Learn/Close
```

| Gate | Pergunta executiva |
| --- | --- |
| Intake | Sabemos o que é, quem responde e qual o risco? |
| Specify | O comportamento, escopo e aceite estão claros? |
| Plan | A menor abordagem, testes, rollback e dependências estão definidos? |
| Preflight | Há autorização e evidência para começar? |
| Execute/Test | O agente alterou apenas o escopo aprovado e executou os testes? |
| Verify/Review | Pedido, spec, plano, diff e evidências estão alinhados? |
| Release/Deploy | Existe aprovação, rollback, comunicação e observabilidade? |
| Observe/Close | O resultado foi observado e o aprendizado foi registrado? |

As regras normativas estão em [`.context/policies/`](../.context/policies/). O glossário de termos está em [`docs/concepts-and-glossary.md`](concepts-and-glossary.md); leia em inglês com tradução assistida quando precisar, sem alterar o significado de `phase`, `status`, `risk`, `severity`, `verification` e `review`.

## 10. Git, push e deploy

O kit prepara e registra a mudança. Ele não instala nem executa infraestrutura de deploy.

Após gates, testes e review:

```bash
git add .context/work/<id> path/to/changed/files
git commit -m "type(scope): describe the approved change"
git push
```

O modo padrão `confirm_each` apresenta evidências e sugere uma mensagem Conventional Commit antes de perguntar separadamente pelo commit e pelo push. O modo `automatic`, escolhido no início, executa ambos somente após os gates e para o work item, branch e remoto registrados. Nenhum modo autoriza force push, deploy ou comandos destrutivos. O processo de release e rollback está em [`templates/common/release.md`](../.context/templates/common/release.md), e o contrato detalhado está em [`docs/agent-orchestration.md`](agent-orchestration.md).

## 11. Governança e controles

O padrão usa:

- políticas `MUST`, `SHOULD` e `MAY`;
- baseline de qualidade sem regressão;
- limites de complexidade, cobertura e duplicação configuráveis por projeto;
- testes orientados a risco;
- validação de segurança, privacidade, secrets, dependências e supply chain;
- governança de IA com least privilege, dados não confiáveis, validação determinística e aprovação humana;
- exceções aprovadas, justificadas, compensadas e expiradas;
- review independente proporcional ao risco;
- rollback, observabilidade e postmortem quando aplicável.

Detalhes empresariais estão em [`docs/enterprise-adoption.md`](enterprise-adoption.md). A documentação normativa está em inglês; esta página serve como tradução executiva e não deve ser usada para criar regras divergentes.

## 12. Como apresentar e pilotar na empresa

### Semana 1 — Configuração

- escolher sponsor, owner e projeto-piloto;
- configurar [`.context/orchestration/config.json`](../.context/orchestration/config.json);
- escolher perfis, agentes, planner, reviewer e release approver;
- preencher `.context/project/`;
- definir política de dados e ferramentas aprovadas;
- explicar Product/Support, gates, subtasks e waves.

### Semanas 2 a 5 — Uso real

- executar pelo menos uma feature Product;
- executar pelo menos um bug, incidente ou hotfix Support;
- observar se o agente cria work items corretamente;
- medir tempo de intake, retrabalho, pass rate, exceções e fricção;
- registrar dúvidas sem contornar os gates silenciosamente.

### Semana 6 — Avaliação

- revisar qualidade, defeitos escapados e riscos;
- avaliar lead time, frequência de deploy, recuperação de falha e retrabalho de deploy;
- avaliar revisão humana de mudanças assistidas por IA;
- revisar idade das exceções;
- decidir expansão, ajustes de perfis ou mudança de governance mode.

O guia empresarial completo está em [`docs/enterprise-adoption.md`](enterprise-adoption.md). A versão inglesa deve ser traduzida durante a apresentação, preservando os nomes dos controles e métricas.

## 13. Mapa de leitura do repositório

| Objetivo | Leia primeiro | Depois |
| --- | --- | --- |
| Entender o produto | [`README.md`](../README.md) | [`docs/getting-started.md`](getting-started.md) |
| Configurar conversa e orquestração | [`AGENTS.md`](../AGENTS.md) | [`docs/agent-orchestration.md`](agent-orchestration.md) e [config JSON](../.context/orchestration/config.json) |
| Escolher Product/Support | [`prompts/intake.md`](../.context/prompts/intake.md) | [`workflows/product.md`](../.context/workflows/product.md) ou [`workflows/support.md`](../.context/workflows/support.md) |
| Escolher perfil | [`profiles/README.md`](../.context/profiles/README.md) | perfil específico em `.context/profiles/` |
| Planejar execução | [`prompts/plan.md`](../.context/prompts/plan.md) | [`templates/common/plan.md`](../.context/templates/common/plan.md) e policy de decomposition |
| Usar ferramentas de contexto | [`tooling/README.md`](../.context/tooling/README.md) | RTK, Caveman, AI-memory e code-review graph |
| Entender qualidade e segurança | [`policies/README.md`](../.context/policies/README.md) | `policies/core/` e `.context/project/` |
| Validar estrutura | [`scripts/validate_context.py`](../scripts/validate_context.py) | `tests/test_validate_context.py` |
| Migrar ou atualizar | [`docs/migration-from-project-context.md`](migration-from-project-context.md) | [`docs/upgrading.md`](upgrading.md) |

Os documentos técnicos acima estão em inglês. Para adoção lusófona, traduza a leitura durante workshops, preserve os nomes dos arquivos, enums, fases e campos JSON, e mantenha este one-pager como ponte executiva em português.

## 14. Decisões solicitadas à liderança

1. Quem será sponsor e owner do padrão?
2. Quais equipes participarão do piloto?
3. Qual perfil será o default e quem pode alterar orchestrator/planner/executor/reviewer?
4. Quais agentes e ferramentas de IA são aprovados?
5. Qual classificação de dados pode entrar em prompts?
6. Quem aprova push, deploy, ações destrutivas e exceções?
7. Quais gates indicam entrada no modo `managed` ou `enterprise`?
8. Qual cadência manterá o snapshot central atualizado?

## Resultado esperado

Ao final do piloto, qualquer pessoa deve conseguir iniciar uma conversa pelo `AGENTS.md`, responder às perguntas de intake, ter um work item criado automaticamente, acompanhar a execução por waves, localizar toda evidência no repositório e saber exatamente quem pode aprovar a próxima decisão.
