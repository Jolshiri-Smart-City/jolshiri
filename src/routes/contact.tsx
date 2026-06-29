import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { LeadDialog } from "@/components/LeadDialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Jolshiri Smart City" },
      { name: "description", content: "Call, WhatsApp or email the Jolshiri Smart City team for inventory, site visits and booking support." },
      { property: "og:title", content: "Contact — Jolshiri Smart City" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t, lang } = useI18n();
  const { data: settings } = useSiteSettings();
  const brand = settings?.brand;
  const address = brand ? (lang === "bn" ? brand.address_bn : brand.address_en) : "Purbachal, Dhaka";
  const [open, setOpen] = useState(false);
  const wa = brand?.whatsapp?.replace(/[^0-9]/g, "");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{t("contact")}</h1>
      <p className="mt-3 text-sm text-muted-foreground">We typically respond within 1 business hour.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {brand?.phone ? (
          <a href={`tel:${brand.phone}`} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-5 hover:border-primary">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Call us</div>
              <div className="font-semibold">{brand.phone}</div>
            </div>
          </a>
        ) : null}
        {brand?.email ? (
          <a href={`mailto:${brand.email}`} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-5 hover:border-primary">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="font-semibold">{brand.email}</div>
            </div>
          </a>
        ) : null}
        {wa ? (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-5 hover:border-primary">
            <MessageCircle className="h-5 w-5 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">WhatsApp</div>
              <div className="font-semibold">{brand?.whatsapp}</div>
            </div>
          </a>
        ) : null}
        {address ? (
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-5">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <div className="text-xs text-muted-foreground">Office</div>
              <div className="font-semibold">{address}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        <Button size="lg" onClick={() => setOpen(true)}>Send us a message</Button>
      </div>

      <LeadDialog open={open} onOpenChange={setOpen} propertyId={null} propertyLabel="General inquiry" />
    </div>
  );
}
