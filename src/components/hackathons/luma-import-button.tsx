"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LumaImportButton() {
  const { userId } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedName, setImportedName] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  if (!userId) return null;

  async function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setImportedName(null);
    setWarning(null);

    try {
      const res = await fetch("/api/hackathons/import/luma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to import event");
      } else {
        setImportedName(data.hackathon.name);
        setWarning(data.warning ?? null);
        setUrl("");
        router.refresh();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setUrl("");
      setError(null);
      setImportedName(null);
      setWarning(null);
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Import className="mr-1.5 h-4 w-4" />
            Import from Luma
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from Luma</DialogTitle>
          <DialogDescription>
            Paste the public URL of your Luma event. It will appear in BuilderMap
            instantly.
          </DialogDescription>
        </DialogHeader>

        {importedName ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-500">
              <strong>{importedName}</strong> was imported successfully.
            </div>
            {warning && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-500">
                {warning} Use <strong>Fix map locations</strong> to retry.
              </div>
            )}
            <DialogFooter showCloseButton>
              <Button
                variant="outline"
                onClick={() => {
                  setImportedName(null);
                  setUrl("");
                }}
              >
                Import another
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="luma-url">Luma event URL</Label>
              <Input
                id="luma-url"
                placeholder="https://luma.com/my-hackathon"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleImport();
                }}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Acepta <code>luma.com/...</code> y <code>lu.ma/...</code>. El evento debe ser público.
              </p>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                onClick={handleImport}
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : null}
                {loading ? "Importing…" : "Import"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
