import { useRef, useState } from "react";
import { Upload, X, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

async function uploadOne(bucket: string, file: File, prefix = ""): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `${prefix}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(key, file, {
    cacheControl: "31536000",
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  // Try public first (works if bucket is public), fallback to signed
  const pub = supabase.storage.from(bucket).getPublicUrl(key);
  if (pub?.data?.publicUrl) {
    // quick HEAD probe via fetch is overkill; just try signed if public 400s on read later
    const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(key, SIGNED_TTL);
    return signed?.signedUrl ?? pub.data.publicUrl;
  }
  const { data: signed, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(key, SIGNED_TTL);
  if (sErr || !signed) throw new Error(sErr?.message ?? "Could not create URL");
  return signed.signedUrl;
}

/** Single image uploader — replaces a URL input. */
export function SingleImageUploader({
  bucket, value, onChange, label, aspect = "video", prefix = "",
}: {
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: "square" | "video";
  prefix?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(file: File) {
    setBusy(true);
    try {
      const url = await uploadOne(bucket, file, prefix);
      onChange(url);
      toast.success("Uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30",
          aspect === "video" ? "aspect-[16/9]" : "aspect-square max-w-[160px]",
        )}
      >
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            disabled={busy}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span>{busy ? "Uploading…" : "Click to upload"}</span>
          </button>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-1 h-3.5 w-3.5" /> {value ? "Replace" : "Upload"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handle(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export interface MediaItem {
  id?: string;
  url: string;
  media_type: "photo" | "floor_plan";
  display_order: number;
}

/** Multi-image uploader for property photos — drag to reorder via arrows, set cover. */
export function PhotoUploader({
  bucket, items, onChange, label, maxItems = 20,
}: {
  bucket: string;
  items: MediaItem[];
  onChange: (next: MediaItem[]) => void;
  label?: string;
  maxItems?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList) {
    const remaining = maxItems - items.length;
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) {
      toast.error(`Max ${maxItems} images`);
      return;
    }
    setBusy(true);
    try {
      const uploaded = await Promise.all(list.map((f) => uploadOne(bucket, f)));
      const startOrder = items.length;
      const next = [
        ...items,
        ...uploaded.map((url, i) => ({ url, media_type: "photo" as const, display_order: startOrder + i })),
      ];
      onChange(next);
      toast.success(`Uploaded ${uploaded.length}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((it, i) => ({ ...it, display_order: i })));
  }
  function remove(idx: number) {
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, display_order: i }));
    onChange(next);
  }
  function makeCover(idx: number) {
    if (idx === 0) return;
    const next = [...items];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next.map((it, i) => ({ ...it, display_order: i })));
  }

  return (
    <div>
      {label && <div className="mb-1 text-sm font-medium">{label}</div>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item, idx) => (
          <div key={item.url} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
            <img src={item.url} alt="" className="h-full w-full object-cover" />
            {idx === 0 && (
              <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                <Star className="h-3 w-3" /> Cover
              </span>
            )}
            <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex gap-1">
                <button type="button" onClick={() => move(idx, -1)} className="rounded bg-white/90 px-1.5 text-xs font-semibold text-foreground">←</button>
                <button type="button" onClick={() => move(idx, 1)} className="rounded bg-white/90 px-1.5 text-xs font-semibold text-foreground">→</button>
                {idx !== 0 && (
                  <button type="button" onClick={() => makeCover(idx)} className="rounded bg-amber-500 px-1.5 text-[10px] font-semibold text-white">Cover</button>
                )}
              </div>
              <button type="button" onClick={() => remove(idx)} className="rounded bg-rose-600 px-1.5 text-xs font-semibold text-white">
                ✕
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || items.length >= maxItems}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/30 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          {busy ? "Uploading…" : "Add photos"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-1 text-xs text-muted-foreground">First image is the cover. Hover to reorder or delete. {items.length}/{maxItems}</p>
    </div>
  );
}
