# Context to Production — Resumo Executivo

## Problema

O desenvolvimento assistido por IA acelera a execução, mas pedidos informais, decisões espalhadas em conversas e ausência de evidências tornam mais provável implementar a coisa errada, esquecer testes, quebrar contratos ou publicar mudanças sem rollback.

## Proposta

Adotar um repositório central versionado com contexto, políticas, templates e gates para conduzir cada trabalho:

```text
Descobrir/Triar → Especificar → Planejar → Validar antes de codar
→ Executar/Testar → Validar e Revisar → Publicar → Observar e Aprender
```

O mesmo núcleo atende Produto e Sustentação. O projeto continua dono da stack, dos comandos, dos limites e da autorização de produção.

## Ganhos esperados

- Menos retrabalho por requisito ambíguo.
- Handoff rastreável entre pessoas, agentes e sessões.
- Evidência única para testes, revisão, release e incidentes.
- Qualidade mínima comum sem impor linguagem, framework, ferramenta de análise ou plataforma.
- Uso de IA com limites de dados, ferramentas, permissões e aprovação humana.
- Evolução do padrão por versão, sem mudanças invisíveis nos projetos.

## Controles

- Policies com MUST/SHOULD/MAY.
- Validador automático de estrutura, schema, fases, links e exceções.
- Exceções aprovadas, justificadas, compensadas e com expiração.
- Sem regressão de qualidade; thresholds definidos por projeto.
- Rollback, observabilidade e postmortem obrigatórios conforme risco.

## Piloto recomendado

Seis semanas com uma equipe de Produto e uma de Sustentação: configuração e treinamento, execução de uma feature e de um bug/incidente, medição de fricção e revisão executiva antes da expansão.

## Decisões solicitadas

1. Sponsor e owner do padrão.
2. Projetos e equipes do piloto.
3. Canal de publicação e governança de versões.
4. Política de dados e ferramentas de IA aprovadas.
5. Critérios de entrada no modo Enterprise.
