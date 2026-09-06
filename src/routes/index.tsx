import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bus,
  Clock3,
  ListOrdered,
  MapPin,
  Navigation,
  Route as RouteIcon,
} from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Routeasy — seu dia de viagem, na ordem certa" },
      {
        name: "description",
        content:
          "Adicione os lugares que deseja conhecer e receba um itinerário organizado por proximidade, prioridade e tempo disponível. Sem cadastro.",
      },
      { property: "og:title", content: "Routeasy — seu dia de viagem, na ordem certa" },
      {
        property: "og:description",
        content:
          "Planejamento inteligente de viagens: itinerário organizado por proximidade, prioridade e tempo disponível.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

/* ------------------------------------------------------------------ */
/* Conteúdo estático da página inicial (apenas apresentação visual)    */
/* ------------------------------------------------------------------ */

const steps = [
  {
    number: "01",
    title: "Escolha os lugares",
    text: "Pesquise atrações, restaurantes e endereços reais.",
  },
  {
    number: "02",
    title: "Defina suas preferências",
    text: "Informe horários, duração das visitas e prioridades.",
  },
  {
    number: "03",
    title: "Receba a melhor ordem",
    text: "Veja o itinerário, o mapa e os deslocamentos estimados.",
  },
];

const benefits = [
  { icon: RouteIcon, text: "Ordem otimizada por proximidade" },
  { icon: Clock3, text: "Horários e duração de cada visita" },
  { icon: Navigation, text: "Abertura das rotas no Waze, Google Maps e Moovit" },
];

const demoStops = [
  { name: "MASP", time: "09:00" },
  { name: "Parque Ibirapuera", time: "11:30" },
  { name: "Pinacoteca", time: "15:00" },
];

const demoTimeline = [
  { time: "09:00", label: "Saída da hospedagem" },
  { time: "09:16–11:16", label: "MASP" },
  { time: "11:42–13:12", label: "Parque Ibirapuera" },
  { time: "13:12–14:12", label: "Almoço" },
  { time: "14:56–16:26", label: "Pinacoteca" },
];

const demoStats = [
  { value: "3", label: "lugares" },
  { value: "22,3 km", label: "percorridos" },
  { value: "1h50", label: "em deslocamentos" },
];

/* ------------------------------------------------------------------ */
/* Demonstração visual do produto (dados estáticos, somente na home)   */
/* ------------------------------------------------------------------ */

function ProductPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-md lg:max-w-none"
      aria-label="Exemplo visual de um roteiro criado no Routeasy"
    >
      {/* Mini mapa com rota e marcadores numerados */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-sky shadow-[var(--shadow-soft)]">
        <svg
          viewBox="0 0 480 300"
          className="block w-full"
          role="img"
          aria-label="Mapa ilustrativo com três paradas numeradas ligadas por uma rota"
        >
          {/* quarteirões sugeridos */}
          <g stroke="var(--border)" strokeWidth="10" opacity="0.7">
            <line x1="0" y1="70" x2="480" y2="55" />
            <line x1="0" y1="150" x2="480" y2="170" />
            <line x1="0" y1="240" x2="480" y2="230" />
            <line x1="90" y1="0" x2="70" y2="300" />
            <line x1="210" y1="0" x2="230" y2="300" />
            <line x1="350" y1="0" x2="330" y2="300" />
            <line x1="430" y1="0" x2="450" y2="300" />
          </g>
          {/* rota */}
          <path
            d="M 96 96 C 150 120, 180 130, 224 148 S 330 190, 368 210"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* marcadores numerados */}
          {[
            { x: 96, y: 96, n: "1" },
            { x: 224, y: 148, n: "2" },
            { x: 368, y: 210, n: "3" },
          ].map((m) => (
            <g key={m.n}>
              <circle cx={m.x} cy={m.y} r="15" fill="var(--primary)" />
              <circle cx={m.x} cy={m.y} r="15" fill="none" stroke="var(--card)" strokeWidth="3" />
              <text
                x={m.x}
                y={m.y + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="var(--primary-foreground)"
              >
                {m.n}
              </text>
            </g>
          ))}
        </svg>
        <p className="absolute bottom-2 right-3 text-[11px] text-muted-foreground">
          Exemplo ilustrativo
        </p>
      </div>

      {/* Cartão de itinerário sobreposto */}
      <div className="relative z-10 -mt-10 ml-auto w-[88%] rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-lift)] sm:-mt-14">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Roteiro do dia
        </p>
        <ul className="space-y-2.5">
          {demoStops.map((stop, index) => (
            <li key={stop.name} className="flex items-center gap-3">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{stop.name}</span>
              <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                {stop.time}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <RouteIcon className="size-3.5" aria-hidden="true" />
          22,3 km · 3 visitas
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página inicial                                                      */
/* ------------------------------------------------------------------ */

function Landing() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />

      <main>
        {/* Seção principal */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="space-y-7">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Planejamento inteligente de viagens
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl">
              Seu dia de viagem, na ordem certa.
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Adicione os lugares que deseja conhecer e receba um itinerário organizado por
              proximidade, prioridade e tempo disponível.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button size="lg" asChild>
                <Link to="/criar">
                  Planejar minha viagem
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Link
                to="/como-funciona"
                className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline"
              >
                Entenda como funciona
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">Gratuito para testar · Sem cadastro</p>
          </div>

          <ProductPreview />
        </section>

        {/* Como funciona */}
        <section
          aria-labelledby="etapas"
          className="border-t border-border py-16 lg:py-20"
        >
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 id="etapas" className="max-w-xl text-3xl font-bold tracking-tight">
              Do planejamento ao roteiro em três etapas
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
              {steps.map((step) => (
                <li key={step.number} className="sm:px-8 sm:first:pl-0 sm:last:pr-0">
                  <span
                    className="block text-5xl font-bold tracking-tight text-primary/25"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Diferencial do produto */}
        <section aria-labelledby="diferencial" className="bg-petrol py-16 text-petrol-foreground lg:py-24">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-5">
              <h2 id="diferencial" className="text-3xl font-bold tracking-tight text-balance">
                Menos tempo decidindo. Mais tempo conhecendo.
              </h2>
              <p className="max-w-md leading-relaxed text-petrol-foreground/80">
                O Routeasy compara a localização dos seus destinos e organiza uma sequência mais
                eficiente para o seu dia.
              </p>
            </div>
            <ul className="space-y-5 self-center">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-petrol-foreground/10">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <span className="font-medium">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Exemplo de itinerário */}
        <section
          aria-labelledby="exemplo"
          className="mx-auto w-full max-w-6xl px-4 py-16 lg:py-24"
        >
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div>
              <h2 id="exemplo" className="text-3xl font-bold tracking-tight">
                Veja seu dia antes de sair
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Exemplo ilustrativo de um dia em São Paulo.
              </p>
              <ol className="mt-8 space-y-0 border-l-2 border-border">
                {demoTimeline.map((item) => (
                  <li key={item.time} className="relative flex items-baseline gap-5 pb-5 pl-6 last:pb-0">
                    <span
                      className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <span className="w-28 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                      {item.time}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="w-full space-y-6 lg:w-64 lg:pt-24">
              <dl className="space-y-4">
                {demoStats.map((stat) => (
                  <div key={stat.label} className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                    <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                    <dd className="text-2xl font-bold tabular-nums">{stat.value}</dd>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bus className="size-4" aria-hidden="true" />
                  Transporte público
                </div>
              </dl>
              <Button asChild className="w-full">
                <Link to="/criar">Criar um roteiro como este</Link>
              </Button>
            </aside>
          </div>
        </section>

        {/* Confiança */}
        <section aria-label="Privacidade" className="border-t border-border py-10">
          <p className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Sem cadastro. Seus roteiros ficam armazenados no seu navegador.
          </p>
        </section>

        {/* Chamada final */}
        <section aria-labelledby="cta-final" className="border-t border-border bg-accent/40 py-16 lg:py-20">
          <div className="mx-auto w-full max-w-6xl space-y-5 px-4">
            <h2 id="cta-final" className="text-3xl font-bold tracking-tight sm:text-4xl">
              Já sabe onde quer ir?
            </h2>
            <p className="text-lg text-muted-foreground">
              Nós ajudamos a decidir a melhor ordem.
            </p>
            <Button size="lg" asChild className="mt-2">
              <Link to="/criar">
                Criar meu roteiro
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <span className="flex items-center gap-2 font-semibold text-foreground">
              <ListOrdered className="size-4" aria-hidden="true" />
              Routeasy
            </span>
            <p>Planejamento inteligente de roteiros</p>
          </div>
          <nav aria-label="Rodapé" className="flex flex-col gap-2 sm:flex-row sm:gap-5">
            <Link to="/como-funciona" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
              Como funciona
            </Link>
            <Link to="/roteiros" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
              Meus roteiros
            </Link>
            <Link to="/criar" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
              Criar roteiro
            </Link>
          </nav>
          <div className="space-y-1.5 sm:text-right">
            <p>Dados de mapas fornecidos pelo OpenStreetMap</p>
            <p>© {year} Routeasy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
