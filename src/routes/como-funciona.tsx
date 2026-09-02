import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, ListChecks, MapPinned, Route as RouteIcon, Sparkles } from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona o Routeasy — roteiros de viagem otimizados" },
      {
        name: "description",
        content:
          "Entenda como o Routeasy organiza seus passeios: você adiciona os lugares, informa horários e recebe um roteiro recomendado por dia.",
      },
      { property: "og:title", content: "Como funciona o Routeasy" },
      {
        property: "og:description",
        content: "Adicione lugares, informe horários e receba um roteiro dia a dia com menos deslocamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComoFunciona,
});

const steps = [
  {
    icon: MapPinned,
    title: "1. Adicione os lugares",
    text: "Pesquise pontos turísticos, restaurantes e hotéis ou cadastre endereços manualmente.",
  },
  {
    icon: Clock3,
    title: "2. Informe seus horários",
    text: "Defina o período da viagem, o horário de início e fim de cada dia e o tempo em cada lugar.",
  },
  {
    icon: RouteIcon,
    title: "3. Receba o itinerário otimizado",
    text: "O Routeasy distribui as visitas entre os dias com a rota recomendada e menos deslocamento.",
  },
];

function ComoFunciona() {
  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="mx-auto w-full max-w-4xl space-y-10 px-4 py-12">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h1>
          <p className="text-muted-foreground">
            Em três etapas simples você sai da lista de desejos para um roteiro dia a dia.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader>
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
            </Card>
          ))}
        </div>

        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-4">
          <AccordionItem value="conta">
            <AccordionTrigger>Preciso criar uma conta?</AccordionTrigger>
            <AccordionContent>
              Não. O Routeasy funciona sem cadastro, sem login e sem pedir dados pessoais. Seus
              roteiros ficam salvos no seu próprio navegador.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="dados">
            <AccordionTrigger>Os dados de mapas são reais?</AccordionTrigger>
            <AccordionContent>
              Enquanto a API de mapas não estiver configurada, o app usa uma base de demonstração com
              coordenadas reais dos locais e estimativas de tempo e distância. Isso fica sempre
              indicado na tela.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="rota">
            <AccordionTrigger>A rota é a melhor possível?</AccordionTrigger>
            <AccordionContent>
              Chamamos de rota recomendada: ela é otimizada com base nas informações disponíveis
              (distâncias, horários de funcionamento, prioridade e ritmo escolhido), e você pode
              ajustar tudo manualmente depois.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-col items-center gap-3">
          <Button size="lg" asChild>
            <Link to="/criar">
              <Sparkles className="size-4" aria-hidden="true" />
              Criar meu roteiro
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/roteiros">
              <ListChecks className="size-4" aria-hidden="true" />
              Ver meus roteiros
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
