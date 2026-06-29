import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { useSiteSettings } from "@/hooks/use-site-settings";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or go home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0e7a6b" },
      { title: "Jolshiri Smart City — Property Search" },
      { name: "description", content: "Search and compare flats across Jolshiri Smart City, Purbachal. Verified inventory, transparent pricing, real-time status." },
      { property: "og:title", content: "Jolshiri Smart City — Property Search" },
      { property: "og:description", content: "Find your home in Purbachal's largest planned smart city." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function TrackingInjector() {
  const { data: settings } = useSiteSettings();
  const seo = settings?.seo;
  useEffect(() => {
    if (!seo) return;
    if (seo.meta_title) document.title = seo.meta_title;
    if (seo.meta_description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
      m.setAttribute("content", seo.meta_description);
    }
    if (seo.keywords) {
      let m = document.querySelector('meta[name="keywords"]');
      if (!m) { m = document.createElement("meta"); m.setAttribute("name", "keywords"); document.head.appendChild(m); }
      m.setAttribute("content", seo.keywords);
    }
    const created: HTMLElement[] = [];
    const addScript = (id: string, src?: string, inner?: string) => {
      if (document.getElementById(id)) return;
      const s = document.createElement("script");
      s.id = id; s.async = true;
      if (src) s.src = src;
      if (inner) s.text = inner;
      document.head.appendChild(s);
      created.push(s);
    };
    if (seo.ga_id) {
      addScript("ga-loader", `https://www.googletagmanager.com/gtag/js?id=${seo.ga_id}`);
      addScript("ga-init", undefined, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.ga_id}');`);
    }
    if (seo.gtm_id) {
      addScript("gtm-init", undefined, `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${seo.gtm_id}');`);
    }
    if (seo.fb_pixel_id) {
      addScript("fb-pixel", undefined, `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${seo.fb_pixel_id}');fbq('track','PageView');`);
    }
    if (seo.head_html) {
      const tpl = document.createElement("template");
      tpl.innerHTML = seo.head_html;
      Array.from(tpl.content.children).forEach((el) => { document.head.appendChild(el); created.push(el as HTMLElement); });
    }
    return () => { created.forEach((el) => el.remove()); };
  }, [seo?.ga_id, seo?.gtm_id, seo?.fb_pixel_id, seo?.head_html, seo?.meta_title, seo?.meta_description, seo?.keywords]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppShell />
        <Toaster richColors position="top-right" />
      </I18nProvider>
    </QueryClientProvider>
  );
}

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hideFooter = pathname.startsWith("/admin");
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TrackingInjector />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      {hideFooter ? null : <Footer />}
    </div>
  );
}
