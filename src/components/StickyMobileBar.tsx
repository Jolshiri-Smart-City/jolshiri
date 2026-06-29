import { Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onInquire: () => void;
  phone?: string | null;
  whatsapp?: string | null;
  whatsappMessage?: string;
}

export function StickyMobileBar({ onInquire, phone, whatsapp, whatsappMessage }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-2 shadow-[0_-4px_18px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        {phone ? (
          <Button asChild variant="outline" size="sm" className="flex-1">
            <a href={`tel:${phone}`}>
              <Phone className="mr-1 h-4 w-4" /> Call
            </a>
          </Button>
        ) : null}
        {whatsapp ? (
          <Button asChild size="sm" className="flex-1 bg-[#25D366] text-white hover:bg-[#1ebe5d]">
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage ?? "")}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          </Button>
        ) : null}
        <Button size="sm" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={onInquire}>
          <MessageSquare className="mr-1 h-4 w-4" /> Inquire
        </Button>
      </div>
    </div>
  );
}
