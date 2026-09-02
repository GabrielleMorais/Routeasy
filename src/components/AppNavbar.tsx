import { Link } from "@tanstack/react-router";
import { Compass, Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const links = [
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/roteiros", label: "Meus roteiros" },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("routeasy:theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("routeasy:theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

export function AppNavbar() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <nav
        aria-label="Navegação principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4"
      >
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Compass className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg">Routeasy</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Button key={link.to} variant="ghost" asChild>
              <Link to={link.to} activeProps={{ className: "bg-accent" }}>
                {link.label}
              </Link>
            </Button>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
              >
                {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{dark ? "Modo claro" : "Modo escuro"}</TooltipContent>
          </Tooltip>
          <Button asChild className="ml-2">
            <Link to="/criar">Começar agora</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {links.map((link) => (
                  <Button key={link.to} variant="ghost" className="justify-start" asChild>
                    <Link to={link.to}>{link.label}</Link>
                  </Button>
                ))}
                <Button asChild>
                  <Link to="/criar">Começar agora</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
