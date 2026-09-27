# Evolução de UX do Routeasy — plano em fases

O documento pede 15 melhorias grandes. Para não quebrar o que já funciona, a entrega será dividida em 4 fases, cada uma validada no fluxo completo (São Paulo, Av. Paulista 900, MASP, Ibirapuera, Pinacoteca) antes de seguir.

## Fase 1 — Criação mais simples e onboarding
- Etapa 1 pede só: destino, datas e hospedagem. Nome gerado automaticamente ("São Paulo · 12–15 Out"), renomeável depois.
- Transporte, ritmo, horários e preferências passam para uma etapa posterior, em blocos recolhíveis.
- Primeira visita: onboarding curto (destino → datas → tipo de viagem com seleção múltipla). O tipo escolhido fica salvo na viagem e orienta as sugestões.

## Fase 2 — Descoberta de lugares
- Na etapa de lugares, sugestões aparecem sozinhas a partir do destino/hospedagem, em cards com categorias (Pontos turísticos, Restaurantes, Parques, Cultura, Cafés, Compras, Vida noturna, Perto da hospedagem…).
- Cards mostram só dados reais disponíveis no OpenStreetMap: nome, categoria, distância da hospedagem, visita sugerida (por categoria), horário quando existir. Foto, nota e preço aparecem apenas se a fonte informar — nada inventado.
- "Quero conhecer" (favoritos): salvar lugares sem colocá-los no roteiro e depois "Organizar no meu roteiro".
- "Talvez você também goste": sugestões perto dos lugares escolhidos, com o impacto ("+8 min no seu roteiro", "Fica no caminho").

## Fase 3 — Tela do roteiro
- Desktop: roteiro 40% / mapa 60%, pontos numerados iguais nos dois. Celular: alternância [Roteiro] [Mapa].
- Arrastar para reordenar, com aviso do impacto e botões "Manter alteração" / "Usar rota recomendada".
- "Por que essa ordem?": explicações geradas das regras reais (horário de abertura, distância do trecho anterior, almoço, agrupamento).
- Resumo de qualidade por regras objetivas (deslocamento, nº de lugares, tempo de atividades, ritmo, dia sobrecarregado + "Reorganizar automaticamente").
- "Preencher meu dia": detecta tempo livre e sugere lugares próximos com "+X min de deslocamento".
- Distribuição automática entre dias por proximidade, horários, duração e ritmo.

## Fase 4 — Melhorar roteiro e compartilhamento
- "Melhorar meu roteiro" com opções (andar menos, dia mais tranquilo, voltar mais cedo, priorizar cultura/restaurantes, adaptar para chuva/crianças/idosos…), mostrando sempre o que mudou.
- Link curto de compartilhamento (routeasy…/r/abc123), só leitura, com estrutura pronta para colaboração futura (registro "Fulano adicionou X").

## Decisões que dependem de você
- Link curto e "Melhorar meu roteiro" com IA exigem ativar o Lovable Cloud (armazenamento online + IA). Sem ele, o link continua longo e as melhorias usam só regras locais. Os roteiros salvos no aparelho continuam intactos em qualquer caso.

## Detalhes técnicos
- Reaproveitar `optimizer.ts`, `route-optimizer.ts`, `computeRouteMetrics`, `fetchNearbyPlaces`, `NearbyPlacesDialog`, `RouteMap`, `ItineraryTimeline`; sem refatoração geral.
- Novos campos opcionais em `Trip` (`tripStyles`, `wishlist`, `activityLog`) — compatíveis com roteiros já salvos.
- Arrastar usa HTML5 drag + botões subir/descer no celular (sem nova biblioteca).
- Sem dados fictícios; sem API paga.
