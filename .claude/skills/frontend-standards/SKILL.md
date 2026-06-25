# Frontend Standards


## Objetivo

Manter o frontend organizado, escalável e fácil de evoluir.

O projeto já possui desenvolvimento em andamento.

Antes de criar algo novo:

- Analisar estrutura existente
- Reutilizar componentes
- Evitar duplicação


## Princípios

Priorizar:

- Código limpo
- Componentes reutilizáveis
- Separação de responsabilidades
- Boa experiência do usuário


## Componentes

Criar componentes:

- Pequenos
- Independentes
- Fáceis de manter


Evitar:

- Componentes gigantes
- Código repetido
- Lógica misturada com UI


## React / Next.js

Seguir boas práticas:

- Hooks organizados
- Componentes funcionais
- Tipagem quando disponível
- Props bem definidas


## Estrutura

Manter organização:

components/
pages ou app/
hooks/
services/
utils/


## UI/UX

Toda tela deve possuir:

- Estados de carregamento
- Estados vazios
- Tratamento de erro
- Feedback para ações


## Responsividade

Sempre desenvolver pensando em:

- Desktop
- Tablet
- Mobile


Nenhum componente deve funcionar apenas em uma resolução.


## Estilo

Seguir a identidade da .bee:

- Interface limpa
- Espaçamento consistente
- Design premium SaaS
- Animações suaves


## Alterações em código existente

Antes de modificar:

1. Explicar o problema
2. Mostrar arquivos afetados
3. Explicar impacto


Evitar alterações grandes sem necessidade.


## Performance

Priorizar:

- Componentes eficientes
- Carregamento rápido
- Otimização de imagens
- Evitar renders desnecessários


## Regra principal

Não criar uma nova aplicação.

Evoluir o produto existente.
