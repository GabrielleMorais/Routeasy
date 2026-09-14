# 🧭 Routeasy

Aplicativo web em desenvolvimento para facilitar o planejamento de viagens e a organização de lugares em roteiros diários.

A proposta é ajudar o usuário a decidir o que visitar e em qual sequência, considerando suas preferências e reduzindo deslocamentos desnecessários.

🔗 [Acessar o aplicativo](https://routeasy.lovable.app)

## Sobre o projeto

O Routeasy nasceu da ideia de reunir o planejamento de passeios em uma única experiência: escolher um destino, adicionar lugares e organizar as visitas ao longo da viagem.

É um projeto de aprendizado e portfólio desenvolvido com apoio do Lovable, durante minha transição de carreira para tecnologia.

## Proposta de experiência

O fluxo planejado contempla:

1. Informar o destino e as preferências da viagem.
2. Pesquisar e selecionar lugares de interesse.
3. Organizar as visitas em roteiros diários.
4. Consultar os locais no mapa e acessar opções de navegação.

Esses itens descrevem a proposta do produto. A disponibilidade e a precisão de cada recurso estão em processo de validação.

## Tecnologias

Principais dependências declaradas no `package.json`:

| Tecnologia | Finalidade |
|---|---|
| React 19 | Construção de interfaces |
| TypeScript | Tipagem do código |
| TanStack Start e TanStack Router | Estrutura da aplicação e navegação |
| TanStack Query | Gerenciamento de consultas e dados assíncronos |
| Tailwind CSS 4 | Estilização |
| Radix UI | Componentes de interface |
| Leaflet | Recursos para mapas interativos |
| React Hook Form e Zod | Formulários e validação |
| Lucide React | Ícones |
| date-fns | Manipulação de datas |
| Vite | Ambiente de desenvolvimento e build |
| ESLint e Prettier | Análise e padronização do código |

A presença de uma dependência não significa que todos os seus recursos estejam sendo utilizados.

## Minha participação

- Idealização do aplicativo e definição do problema.
- Elaboração e refinamento dos requisitos.
- Desenvolvimento com apoio do Lovable e de ferramentas de IA.
- Testes manuais dos fluxos.
- Identificação de problemas e solicitação de ajustes.
- Revisão da interface e da experiência de uso.
- Organização da documentação e do repositório.

Estou aprofundando minha compreensão do código e das tecnologias utilizadas ao longo da evolução do projeto.

## Executar localmente

### Pré-requisitos

- Git.
- Node.js em uma versão compatível com o Vite 8.
- npm.
- Permissão de acesso ao repositório enquanto ele permanecer privado.

### Instalação

```bash
git clone https://github.com/GabrielleMorais/journey-planner-pro-10.git
cd journey-planner-pro-10
npm install
npm run dev
```

Abra o endereço informado pelo terminal.

Esses comandos seguem os scripts do projeto. A execução local e eventuais configurações adicionais ainda precisam ser validadas.

### Scripts disponíveis

| Comando | Ação |
|---|---|
| `npm run dev` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera o build |
| `npm run build:dev` | Gera o build em modo de desenvolvimento |
| `npm run preview` | Inicia a prévia do build |
| `npm run lint` | Executa o ESLint |
| `npm run format` | Aplica a formatação com Prettier |

## Estrutura principal

- `src/`: código-fonte da aplicação.
- `public/`: arquivos estáticos.
- `package.json`: dependências e scripts.
- `vite.config.ts`: configuração do Vite.
- `tsconfig.json`: configuração do TypeScript.

## Status e próximas etapas

Projeto em evolução. Próximos pontos de validação:

- [ ] Documentar quais funcionalidades estão operacionais.
- [ ] Identificar a origem dos dados e eventuais dados simulados.
- [ ] Validar o ponto de partida e a organização das visitas.
- [ ] Revisar a busca e as sugestões de lugares.
- [ ] Verificar os links de navegação para Waze e Moovit.
- [ ] Documentar como os roteiros são armazenados.
- [ ] Validar instalação e execução local.
- [ ] Revisar acessibilidade e comportamento em dispositivos móveis.
- [ ] Adicionar capturas de tela do aplicativo.

As sugestões de roteiro não representam garantia de trajeto ideal, horários atualizados ou informações de trânsito em tempo real.

## Melhoria realizada: validação de endereços

Durante a revisão do projeto, foi identificado que uma falha na busca de endereços poderia gerar coordenadas fictícias e posicionar o ponto de partida incorretamente.

A correção, realizada com apoio do Lovable, removeu esse comportamento e adicionou:

- Mensagens diferentes para endereço não encontrado e serviço indisponível.
- Opção de tentar novamente.
- Invalidação das coordenadas anteriores quando o endereço é editado.
- Bloqueio do avanço sem um ponto de partida confirmado.

Esse ajuste fez parte do meu aprendizado sobre validação de dados, tratamento de erros e revisão crítica de código gerado com IA.

## Autora

**Gabrielle Morais**

Em transição de carreira para tecnologia, com foco em Python e Inteligência Artificial.

[GitHub](https://github.com/GabrielleMorais) · [LinkedIn](https://www.linkedin.com/in/gabrielle-morais-777a202ba/)
