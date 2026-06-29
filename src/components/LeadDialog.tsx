import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitLead } from "@/lib/properties.functions";
import { useI18n } from "@/lib/i18n";

export function LeadDialog({
  open,
  onOpenChange,
  propertyId,
  propertyLabel,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  propertyId?: string;
  propertyLabel?: string;
}) {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [requestType, setRequestType] = useState("callback");

  const mut = useMutation({
    mutationFn: () =>
      submitLead({
        data: {
          propertyId,
          fullName,
          phone,
          email: email || undefined,
          message: message || undefined,
          requestType,
        },
      }),
    onSuccess: () => {
      toast.success(t("thanks"));
      setFullName(""); setPhone(""); setEmail(""); setMessage("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("inquire")}</DialogTitle>
          {propertyLabel ? (
            <DialogDescription>{t("inquireAbout")}: <span className="font-medium text-foreground">{propertyLabel}</span></DialogDescription>
          ) : null}
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!fullName.trim() || !phone.trim()) {
              toast.error("Name and phone required");
              return;
            }
            mut.mutate();
          }}
        >
          <div>
            <Label>{t("yourName")}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{t("phone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div>
              <Label>{t("email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>{t("requestType")}</Label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="callback">{t("callback")}</SelectItem>
                <SelectItem value="site_visit">{t("siteVisit")}</SelectItem>
                <SelectItem value="booking">{t("booking")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("message")}</Label>
            <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {mut.isPending ? "…" : t("send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
