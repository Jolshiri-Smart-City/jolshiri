import { MessageCircle } from "lucide-react";

export function WhatsAppFab({ phone, message }: { phone?: string; message?: string }) {
  if (!phone) return null;
  const clean = phone.replace(/[^\d]/g, "");
  const url = `https://wa.me/${clean}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 transition-transform hover:scale-105"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
