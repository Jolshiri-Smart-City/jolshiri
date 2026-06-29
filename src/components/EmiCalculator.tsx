import { useMemo, useState } from "react";
import { formatBDT } from "@/lib/i18n";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function EmiCalculator({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20);
  const [tenure, setTenure] = useState(20);
  const [rate, setRate] = useState(9);

  const { monthly, totalInterest, principal } = useMemo(() => {
    const principal = Math.max(0, price * (1 - downPct / 100));
    const r = rate / 12 / 100;
    const n = tenure * 12;
    const monthly = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalInterest = monthly * n - principal;
    return { monthly, totalInterest, principal };
  }, [price, downPct, tenure, rate]);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-lg font-semibold">EMI Calculator</h3>
      <p className="text-xs text-muted-foreground">Estimate your monthly home loan payment.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <Label className="text-xs">Down payment ({downPct}%)</Label>
          <Input type="number" min={0} max={100} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Tenure (years)</Label>
          <Input type="number" min={1} max={30} value={tenure} onChange={(e) => setTenure(Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Interest rate (%)</Label>
          <Input type="number" step="0.1" min={0} max={30} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 rounded-md bg-secondary/50 p-3 sm:grid-cols-3">
        <Metric label="Monthly EMI" value={formatBDT(Math.round(monthly))} accent />
        <Metric label="Loan amount" value={formatBDT(Math.round(principal))} />
        <Metric label="Total interest" value={formatBDT(Math.round(totalInterest))} />
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
