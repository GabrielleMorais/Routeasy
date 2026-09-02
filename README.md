# Roteiro Fácil

Crie um aplicativo web responsivo de planejamento inteligente de viagens chamado provisoriamente “Routeasy”.

OBJETIVO DO APLICATIVO

O aplicativo deve ajudar turistas a organizar vários lugares que desejam conhecer em uma viagem, evitando que precisem pesquisar cada trajeto individualmente.

O usuário poderá adicionar diversos pontos turísticos, restaurantes, hotéis ou endereços. O sistema deverá analisar:

Localização de cada lugar;

Distância entre os locais;

Tempo estimado de deslocamento;

Horário de funcionamento;

Tempo que o usuário deseja permanecer em cada lugar;

Horário inicial e final disponível no dia;

Meio de transporte escolhido.

Depois, o aplicativo deverá sugerir automaticamente a melhor ordem de visita, permitindo conhecer aproximadamente 3 ou 4 lugares por dia com o menor deslocamento possível.

STACK E PADRÃO VISUAL

Utilize:

React;

TypeScript;

Tailwind CSS;

shadcn/ui;

Lucide React para os ícones;

React Router para navegação;

React Hook Form e Zod para formulários e validações;

date-fns para datas e horários;

Supabase para banco de dados;

Uma API de mapas e rotas, preferencialmente Google Maps Platform ou Mapbox.

Use somente componentes shadcn/ui sempre que houver um componente equivalente, incluindo:

Button;

Card;

Input;

Label;

Select;

Dialog;

Sheet;

Tabs;

Badge;

Tooltip;

Popover;

Calendar;

Dropdown Menu;

Accordion;

Alert;

Skeleton;

Toast;

Separator;

Progress.

Não criar componentes visuais genéricos quando houver um componente equivalente no shadcn/ui.

IDENTIDADE VISUAL

Quero uma interface moderna, elegante, acolhedora e simples de usar.

Direção visual:

Estética de aplicativo moderno de viagem;

Layout limpo e com bastante espaço em branco;

Bordas arredondadas;

Sombras suaves;

Boa hierarquia visual;

Microinterações discretas;

Totalmente responsivo;

Mobile-first;

Acessível e com bom contraste.

Paleta sugerida:

Cor principal: azul-petróleo ou turquesa;

Cor secundária: azul-claro;

Destaques: coral suave;

Fundo: branco ou cinza muito claro;

Textos: azul-marinho escuro.

Use uma fonte moderna e legível, como Inter.

Inclua modo claro e modo escuro.

PÁGINAS DO APLICATIVO

LANDING PAGE

Criar uma página inicial contendo:

Navbar com logo, “Como funciona”, “Meus roteiros” e botão “Começar agora”;

Hero section com o título:
“Conheça mais lugares. Perca menos tempo no caminho.”

Subtítulo explicando que o aplicativo organiza automaticamente a melhor ordem das visitas;

Botões “Criar meu roteiro” e “Ver como funciona”;

Ilustração ou mockup mostrando um mapa com vários pontos conectados;

Seção explicando o funcionamento em três passos:

Adicione os lugares;

Informe seus horários;

Receba o itinerário otimizado;

Seção de benefícios;

Exemplo visual de um roteiro;

Footer.

O botão “Começar agora” deverá levar diretamente para a criação de um novo roteiro, sem exigir cadastro ou login.

DASHBOARD

O dashboard deverá ser acessível diretamente, sem autenticação.

Exibir:

Título “Meus roteiros”;

Botão destacado “Criar novo roteiro”;

Próxima viagem;

Roteiros recentes;

Roteiros salvos;

Cards com cidade, período, quantidade de lugares e status;

Estado vazio amigável quando ainda não houver roteiros;

Opções para abrir, duplicar, editar e excluir um roteiro.

Como não haverá autenticação, os roteiros poderão ser armazenados localmente no navegador usando localStorage ou IndexedDB durante o MVP.

Estruture o código para permitir a integração futura com um banco de dados, mas não implemente autenticação, cadastro ou login.

CRIAÇÃO DO ROTEIRO

Criar um fluxo dividido em etapas, usando um Stepper visual.

ETAPA 1 — INFORMAÇÕES DA VIAGEM

Solicitar:

Nome da viagem;

Cidade ou destino;

Data inicial;

Data final;

Endereço da hospedagem ou ponto de partida;

Horário em que deseja começar cada dia;

Horário em que deseja terminar cada dia;

Meio de transporte:

Carro;

Transporte público;

Bicicleta;

A pé;

Preferência de ritmo:

Tranquilo;

Equilibrado;

Intenso.

ETAPA 2 — ADICIONAR LUGARES

O usuário poderá pesquisar e adicionar locais por nome ou endereço.

Cada lugar deverá apresentar:

Nome;

Categoria;

Endereço;

Foto, quando disponível;

Avaliação, quando disponível;

Horário de funcionamento;

Tempo estimado de visita;

Prioridade;

Observações.

Categorias:

Ponto turístico;

Restaurante;

Café;

Museu;

Parque;

Compras;

Evento;

Hotel;

Outro.

Tempo estimado de visita:

30 minutos;

1 hora;

1 hora e 30 minutos;

2 horas;

3 horas;

Personalizado.

Prioridade:

Imperdível;

Quero conhecer;

Opcional.

Permitir:

Adicionar lugares pela pesquisa;

Adicionar endereço manualmente;

Editar um local;

Excluir um local;

Reordenar manualmente;

Visualizar os pontos no mapa;

Marcar um restaurante como almoço ou jantar;

Definir um horário fixo para reservas ou ingressos.

Apresente uma mensagem recomendando pelo menos três lugares para gerar uma rota útil.

ETAPA 3 — PREFERÊNCIAS

Perguntar:

O usuário aceita sair e voltar para a hospedagem todos os dias?

Qual o tempo máximo aceitável de deslocamento entre dois locais?

Deseja incluir intervalo para almoço?

Horário preferido do almoço;

Duração do almoço;

Deseja incluir intervalo para jantar?

Locais ou compromissos com horário fixo;

Deseja evitar pedágios?

Deseja evitar caminhadas longas?

Necessita de opções acessíveis para pessoas com mobilidade reduzida?

ETAPA 4 — GERAR ROTEIRO

Ao clicar em “Gerar meu roteiro”, organizar automaticamente os locais levando em consideração:

Proximidade geográfica;

Tempo estimado do trajeto;

Horários de funcionamento;

Horários fixos e reservas;

Prioridade dos lugares;

Tempo de permanência;

Horário inicial e final do dia;

Meio de transporte;

Quantidade de dias;

Intervalos para alimentação;

Retorno à hospedagem, se selecionado.

A rota deve minimizar deslocamentos desnecessários.

Distribua os locais entre os dias da viagem. Como referência, organize de 3 a 4 visitas principais por dia, mas ajuste essa quantidade conforme horários, distâncias e duração das atividades.

Nenhum local pode aparecer em um horário em que esteja fechado.

Caso não seja possível encaixar todos os lugares, crie uma seção “Não incluídos no roteiro” explicando o motivo de cada exclusão.

TELA DO ITINERÁRIO

Criar uma página com duas áreas principais:

Lista cronológica do roteiro;

Mapa interativo com os pontos e a rota.

No desktop:

Itinerário à esquerda;

Mapa fixo à direita.

No celular:

Alternância por abas entre “Roteiro” e “Mapa”;

Criar também uma visualização inferior resumida e fácil de utilizar durante a viagem.

Mostrar abas para cada dia, como:

Dia 1;

Dia 2;

Dia 3.

Cada dia deverá apresentar uma linha do tempo com:

Horário de saída;

Ponto de partida;

Tempo de deslocamento;

Meio de transporte;

Nome do local;

Horário de chegada;

Tempo de permanência;

Horário de saída;

Categoria;

Endereço;

Observações;

Próximo deslocamento.

Exemplo:

08:30 — Saída do hotel
09:00 às 11:00 — Museu do Louvre
11:00 às 11:25 — Deslocamento a pé
11:30 às 13:00 — Jardim das Tulherias
13:15 às 14:30 — Almoço
15:00 às 17:00 — Torre Eiffel

Utilizar cores diferentes para:

Visitas;

Deslocamentos;

Refeições;

Horários livres;

Alertas.

MAPA

O mapa deverá:

Mostrar todos os pontos;

Numerar os pontos conforme a ordem das visitas;

Traçar a rota;

Utilizar uma cor diferente para cada dia;

Mostrar informações do local ao selecionar um marcador;

Centralizar automaticamente todos os pontos;

Permitir selecionar apenas um dia;

Calcular distância e duração estimadas;

Mostrar a localização da hospedagem;

Oferecer um botão “Abrir no Google Maps”.

Utilize dados reais quando a API estiver configurada.

Enquanto não houver API configurada, desenvolva o aplicativo com dados simulados bem estruturados e mantenha a integração preparada em uma camada de serviço separada. Não invente resultados como se fossem dados reais.

EDIÇÃO DO ROTEIRO

Permitir que o usuário:

Arraste uma atividade para mudar a ordem;

Mova um lugar para outro dia;

Altere horários;

Remova lugares;

Adicione uma nova parada;

Bloqueie um lugar ou horário para impedir que a otimização o altere;

Solicite nova otimização;

Desfaça a última alteração;

Restaure o roteiro original.

Quando o usuário mudar a ordem manualmente, recalcular os horários e avisar se houver:

Conflito de horário;

Local fechado;

Tempo insuficiente;

Deslocamento muito longo;

Atividades sobrepostas.

COMPARTILHAMENTO

Permitir:

Salvar o roteiro localmente;

Compartilhar por link;

Copiar link;

Exportar para PDF;

Imprimir;

Abrir trajetos no Google Maps;

Gerar uma versão resumida para enviar pelo WhatsApp.

Para o MVP sem autenticação, o compartilhamento poderá funcionar por meio de:

Dados codificados no link;

Identificador público do roteiro;

Registro público no banco de dados, sem informações pessoais.

Criar um modo de visualização pública somente para leitura.

MODO DURANTE A VIAGEM

Criar uma versão simplificada para uso no celular contendo:

Próxima atividade;

Horário;

Endereço;

Tempo até o local;

Botão “Como chegar”;

Botão “Concluído”;

Botão “Pular”;

Indicador de progresso do dia;

Aviso de atraso.

Se o usuário marcar uma atividade como concluída ou pulada, atualizar o progresso.

ESTADOS DA INTERFACE

Criar todos os estados necessários:

Carregamento com Skeleton;

Erro de busca;

Erro ao calcular rota;

Nenhum local encontrado;

Roteiro vazio;

Roteiro salvo;

Sem conexão;

API de mapas não configurada;

Local fechado;

Conflito de horários;

Lugares que não couberam no dia;

Confirmação antes de excluir.

ARMAZENAMENTO DOS DADOS

Para o MVP, armazenar os roteiros no navegador usando localStorage ou IndexedDB.

Criar uma camada de serviço de armazenamento separada da interface, para que futuramente seja possível substituir o armazenamento local pelo Supabase sem alterar toda a aplicação.

Caso seja utilizado Supabase apenas para o compartilhamento público, criar as seguintes tabelas sem dados pessoais e sem autenticação:

trips:

id;

title;

destination;

start_date;

end_date;

accommodation_address;

accommodation_latitude;

accommodation_longitude;

daily_start_time;

daily_end_time;

transport_mode;

travel_pace;

status;

share_token;

is_public;

created_at;

updated_at.

places:

id;

trip_id;

external_place_id;

name;

category;

address;

latitude;

longitude;

image_url;

rating;

opening_hours;

visit_duration_minutes;

priority;

notes;

fixed_date;

fixed_start_time;

is_locked;

created_at.

itinerary_days:

id;

trip_id;

date;

day_number;

total_distance;

total_travel_minutes;

created_at.

itinerary_items:

id;

itinerary_day_id;

place_id;

item_type;

position;

start_time;

end_time;

travel_minutes;

travel_distance;

transport_mode;

status;

warning;

created_at.

Não criar tabelas de usuários ou perfis.

Não solicitar nome, e-mail, senha ou qualquer informação de login.

Se o Supabase for utilizado, os roteiros públicos deverão ser acessados somente por um token de compartilhamento seguro e difícil de adivinhar.

LÓGICA DE OTIMIZAÇÃO

Para o primeiro MVP, implementar uma heurística clara e separada da interface.

A lógica inicial poderá:

Priorizar compromissos com horário fixo;

Agrupar locais próximos geograficamente;

Distribuir esses grupos entre os dias disponíveis;

Iniciar pelo local mais próximo da hospedagem ou ponto de partida;

Selecionar o próximo local viável mais próximo;

Conferir horário de funcionamento;

Somar tempo de visita e deslocamento;

Inserir intervalos de alimentação;

Encerrar o dia no horário definido;

Colocar atividades inviáveis na lista de não incluídas.

Estruture essa lógica em um serviço independente para permitir uma futura substituição por um algoritmo mais avançado ou por uma API externa.

Não afirmar que a rota é matematicamente perfeita. Utilizar o termo “rota recomendada” ou “rota otimizada com base nas informações disponíveis”.

COMPONENTES REUTILIZÁVEIS

Criar componentes como:

AppNavbar;

TripCard;

CreateTripStepper;

PlaceSearch;

PlaceCard;

PriorityBadge;

TransportSelector;

TravelPreferencesForm;

ItineraryTimeline;

ItineraryItem;

DayTabs;

RouteMap;

RouteSummary;

ConflictAlert;

UnscheduledPlaces;

ShareTripDialog;

MobileTravelMode;

EmptyState;

LoadingState.

DADOS DEMONSTRATIVOS

Criar um roteiro demonstrativo completo para São Paulo com:

Hospedagem na Avenida Paulista;

MASP;

Parque Ibirapuera;

Mercado Municipal;

Museu Catavento;

Farol Santander;

Pinacoteca;

Bairro da Liberdade;

Um restaurante para almoço.

Distribuir os locais de forma coerente em dois dias, usando dados claramente identificados como demonstração.

RESPONSIVIDADE E ACESSIBILIDADE

Garantir:

Excelente experiência em celular;

Navegação por teclado;

Labels em todos os campos;

Textos alternativos em imagens;

Contraste adequado;

Indicadores visuais que não dependam somente de cor;

Botões com áreas de toque adequadas;

Feedback de carregamento;

Mensagens de erro objetivas;

Compatibilidade com leitores de tela.

REGRAS IMPORTANTES

Todo o aplicativo deve estar em português do Brasil;

Utilizar shadcn/ui como biblioteca principal de componentes;

Não criar autenticação;

Não criar cadastro;

Não criar login;

Não criar recuperação de senha;

Não solicitar dados pessoais;

Não bloquear nenhuma página com autenticação;

Não utilizar textos genéricos em inglês;

Não criar apenas um protótipo visual;

Implementar navegação funcional;

Implementar formulários e validações;

Criar os tipos TypeScript;

Criar os dados simulados;

Separar componentes, páginas, serviços, hooks e tipos;

Preparar a integração com uma API de mapas;

Não expor chaves de API no código;

Utilizar variáveis de ambiente;

Tratar erros das APIs;

Manter o código organizado, reutilizável e fácil de expandir.

ORDEM DE IMPLEMENTAÇÃO

Construa inicialmente um MVP funcional com:

Landing page;

Dashboard sem autenticação;

Fluxo de criação da viagem;

Cadastro e edição de lugares;

Geração de itinerário com dados simulados;

Timeline por dia;

Mapa com marcadores;

Salvamento local no navegador;

Edição do roteiro;

Compartilhamento do roteiro.

Antes de adicionar funcionalidades secundárias, certifique-se de que o fluxo principal esteja funcionando do início ao fim.

Comece criando a estrutura, o design system, as páginas e o fluxo completo usando dados simulados.

Depois, implemente o armazenamento local. Deixe a integração da API de mapas isolada e preparada para receber as credenciais posteriormente.

Não implemente autenticação nesta versão.

Ao finalizar, informe:

Quais funcionalidades foram implementadas;

Quais utilizam dados simulados;

Quais variáveis de ambiente precisam ser configuradas;

Como os roteiros estão sendo armazenados;

O que ainda falta para utilizar rotas e mapas reais.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://journey-planner-pro-10.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/30692dc0-ce87-4162-ab41-869a7b23ef2b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
