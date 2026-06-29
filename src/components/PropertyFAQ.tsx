import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ { q: string; a: string }

export function buildPropertyFaqs(opts: {
  unit: string;
  project: string;
  possession?: string | null;
  bookingMoney?: number | null;
  ready: boolean;
}): FAQ[] {
  const faqs: FAQ[] = [
    {
      q: `Is Unit ${opts.unit} at ${opts.project} ready to move in?`,
      a: opts.ready
        ? `Yes, this unit is ready for handover. You can schedule a site visit and start the registration process immediately.`
        : opts.possession
          ? `This unit is under construction. Estimated possession is by ${opts.possession}. We can share the latest construction update on request.`
          : `This unit is under construction. Possession timeline can be confirmed on a callback.`,
    },
    {
      q: `What is the booking process and down payment?`,
      a: opts.bookingMoney
        ? `Booking starts at ৳${Number(opts.bookingMoney).toLocaleString("en-IN")}. The full payment plan, including instalments and handover charges, is shown in the Payment Plan tab.`
        : `The booking amount and payment plan are listed in the Payment Plan tab. Our team can walk you through each milestone on a call.`,
    },
    {
      q: `Can I visit the site and inspect the apartment?`,
      a: `Yes — request a site visit through the form on this page. Visits are available Saturday through Thursday between 10 AM and 6 PM.`,
    },
    {
      q: `What documentation will I receive on registration?`,
      a: `On registration you receive the deed of sale, mutation paperwork, and possession handover certificate. Bank loan facilitation is available for eligible buyers.`,
    },
  ];
  return faqs;
}

export function PropertyFAQ({ faqs }: { faqs: FAQ[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold sm:text-2xl">Frequently asked questions</h2>
      <Accordion type="single" collapsible className="mt-4">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`q-${i}`}>
            <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-foreground/80">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
