import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  Clock3,
  Compass,
  MapPinned,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import heroMapa from "@/assets/hero-mapa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Routeasy — roteiros de viagem otimizados por dia" },
      {
        name: "description",
        content:
          "Adicione os lugares que quer conhecer e receba a melhor ordem de visita por dia, com horários, deslocamentos e mapa. Sem cadastro.",
      },
      { property: "og:title", content: "Routeasy — roteiros de viagem otimizados por dia" },
      {
        property: "og:description",
        content: "Conheça mais lugares e perca menos tempo no caminho. Roteiro pronto em minutos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  { icon: MapPinned, title: "Adicione os lugares", text: "Pontos turísticos, restaurantes, museus e o endereço da hospedagem." },
  { icon: Clock3, title: "Informe seus horários", text: "Período da viagem, janela de cada dia e tempo desejado em cada lugar." },
  { icon: RouteIcon, title: "Receba o itinerário otimizado", text: "3 a 4 visitas por dia na melhor ordem, com deslocamentos estimados." },
];

const benefits = [
  { icon: Wallet, title: "Menos tempo no trânsito", text: "Agrupamos os locais próximos para reduzir os deslocamentos do dia." },
  { icon: CalendarClock, title: "Respeita horários", text: "Nenhum lugar entra no roteiro em um horário em que esteja fechado." },
  { icon: ShieldCheck, title: "Sem cadastro", text: "Nada de login, senha ou dados pessoais. Tudo salvo no seu navegador." },
];

const sample = [
  { time: "08:30", label: "Saída do hotel", tone: "var(--free)" },
  { time: "09:00 – 11:00", label: "MASP", tone: "var(--visit)" },
  { time: "11:00 – 11:25", label: "Deslocamento a pé", tone: "var(--travel)" },
  { time: "11:30 – 13:00", label: "Parque Ibirapuera", tone: "var(--visit)" },
  { time: "13:15 – 14:30", label: "Almoço", tone: "var(--meal)" },
  { time: "15:00 – 17:00", label: "Pinacoteca", tone: "var(--visit)" },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <AppNavbar />

      <main>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div className="space-y-6">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="size-3" aria-hidden="true" />
              Roteiro pronto em minutos
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Conheça mais lugares. Perca menos tempo no caminho.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              O Routeasy organiza automaticamente a melhor ordem das suas visitas: analisa
              distâncias, horários de funcionamento e o tempo que você quer ficar em cada lugar — e
              monta seu itinerário dia a dia.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/criar">Criar meu roteiro</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/como-funciona">Ver como funciona</Link>
              </Button>
            </div>
          </div>
          <img
            src={heroMapa}
            alt="Ilustração de um mapa com vários pontos turísticos numerados conectados por uma rota"
            width={1280}
            height={960}
            className="w-full rounded-3xl shadow-[var(--shadow-lift)]"
          />
        </section>

        <Separator />

        <section aria-labelledby="passos" className="mx-auto w-full max-w-6xl space-y-6 px-4 py-14">
          <h2 id="passos" className="text-center text-3xl font-bold tracking-tight">
            Em três passos
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <Card key={title}>
                <CardHeader>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-base">
                    {index + 1}. {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="beneficios" className="bg-accent/40 py-14">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4">
            <h2 id="beneficios" className="text-center text-3xl font-bold tracking-tight">
              Por que usar o Routeasy
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {benefits.map(({ icon: Icon, title, text }) => (
                <Card key={title}>
                  <CardHeader>
                    <span className="flex size-11 items-center justify-center rounded-xl bg-coral text-coral-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="text-base">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="exemplo" className="mx-auto w-full max-w-3xl space-y-6 px-4 py-14">
          <h2 id="exemplo" className="text-center text-3xl font-bold tracking-tight">
            Exemplo de um dia
          </h2>
          <Card>
            <CardContent className="space-y-3 p-5">
              {sample.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-xl border-l-4 bg-muted/40 p-3"
                  style={{ borderLeftColor: item.tone }}
                >
                  <span className="w-32 shrink-0 font-mono text-sm tabular-nums">{item.time}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="text-center">
            <Button size="lg" asChild>
              <Link to="/criar">Começar agora</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 text-center text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Compass className="size-5" aria-hidden="true" />
            Routeasy
          </span>
          <p>Roteiros recomendados com base nas informações disponíveis. Sem cadastro, sem login.</p>
          <nav aria-label="Rodapé" className="flex gap-4">
            <Link to="/como-funciona" className="underline-offset-4 hover:underline">
              Como funciona
            </Link>
            <Link to="/roteiros" className="underline-offset-4 hover:underline">
              Meus roteiros
            </Link>
            <Link to="/criar" className="underline-offset-4 hover:underline">
              Criar roteiro
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
