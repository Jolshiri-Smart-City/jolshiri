import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function Footer() {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();
  const brand = settings?.brand;
  const brandName = brand?.name_en || t("brand");
  const address = brand?.address_en || "Purbachal, Dhaka";

  const socials: Array<{ href?: string; Icon: typeof Facebook; label: string }> = [
    { href: brand?.facebook, Icon: Facebook, label: "Facebook" },
    { href: brand?.instagram, Icon: Instagram, label: "Instagram" },
    { href: brand?.youtube, Icon: Youtube, label: "YouTube" },
    { href: brand?.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { href: brand?.twitter, Icon: Twitter, label: "Twitter" },
  ].filter((s) => !!s.href) as Array<{ href: string; Icon: typeof Facebook; label: string }>;

  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="font-display text-base font-semibold text-foreground">{brandName}</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground">Explore</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">{t("home")}</Link></li>
            <li><Link to="/properties" className="hover:text-foreground">{t("properties")}</Link></li>
            <li><Link to="/compare" className="hover:text-foreground">{t("compare")}</Link></li>
            <li><Link to="/about" className="hover:text-foreground">{t("about")}</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">{t("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground">{t("contact")}</div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {address ? (
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{address}</span></li>
            ) : null}
            {brand?.phone ? (
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><a href={`tel:${brand.phone}`} className="hover:text-foreground">{brand.phone}</a></li>
            ) : null}
            {brand?.email ? (
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><a href={`mailto:${brand.email}`} className="hover:text-foreground">{brand.email}</a></li>
            ) : null}
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground">Follow</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {socials.length === 0 ? (
              <span className="text-xs text-muted-foreground">Add social links in admin settings.</span>
            ) : (
              socials.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border/70 bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brandName} · Purbachal, Dhaka
      </div>
    </footer>
  );
}
