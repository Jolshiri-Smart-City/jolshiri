import { Quote, Star } from "lucide-react";

interface Testimonial { name: string; role?: string; text: string; rating?: number }

const FALLBACK: Testimonial[] = [
  {
    name: "Rashidul Karim",
    role: "Bought a 3-BHK in Sector 5",
    text: "The team showed me three flats in one afternoon and the pricing was exactly what was advertised. No hidden charges, smooth registration.",
    rating: 5,
  },
  {
    name: "Nadia Hossain",
    role: "Investor",
    text: "Best inventory I've seen for Purbachal. Real-time status saved me from chasing booked units like with other agencies.",
    rating: 5,
  },
  {
    name: "Md. Tanvir Ahmed",
    role: "First-time buyer",
    text: "Bangla support was a huge help for my family. The site visit was on time and the payment plan was explained clearly.",
    rating: 5,
  },
];

export function Testimonials({ items }: { items?: Testimonial[] }) {
  const list = items && items.length > 0 ? items : FALLBACK;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">What buyers say</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t, i) => (
          <figure key={i} className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
            <Quote className="h-6 w-6 text-primary/40" />
            <blockquote className="mt-3 text-sm leading-relaxed text-foreground/90">"{t.text}"</blockquote>
            <figcaption className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                {t.role ? <div className="text-xs text-muted-foreground">{t.role}</div> : null}
              </div>
              {t.rating ? (
                <div className="flex">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
