"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Hackathon } from "@/types/database";
import { HACKATHON_CATEGORIES } from "@/types/database";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Star, StarOff } from "lucide-react";

interface AdminHackathonListProps {
  hackathons: Hackathon[];
  userId: string;
}

type HackathonForm = {
  name: string;
  organizer: string;
  description: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  modality: "remote" | "in-person" | "hybrid";
  location_city: string;
  location_country: string;
  category: string;
  tags: string;
  prize_pool: string;
  official_url: string;
  requirements: string;
  image_url: string;
  status: "upcoming" | "active" | "past";
};

const emptyForm: HackathonForm = {
  name: "",
  organizer: "",
  description: "",
  start_date: "",
  end_date: "",
  registration_deadline: "",
  modality: "remote",
  location_city: "",
  location_country: "",
  category: "",
  tags: "",
  prize_pool: "",
  official_url: "",
  requirements: "",
  image_url: "",
  status: "upcoming",
};

function hackathonToForm(h: Hackathon): HackathonForm {
  return {
    name: h.name,
    organizer: h.organizer ?? "",
    description: h.description ?? "",
    start_date: h.start_date ?? "",
    end_date: h.end_date ?? "",
    registration_deadline: h.registration_deadline ?? "",
    modality: h.modality,
    location_city: h.location_city ?? "",
    location_country: h.location_country ?? "",
    category: h.category ?? "",
    tags: (h.tags ?? []).join(", "),
    prize_pool: h.prize_pool ?? "",
    official_url: h.official_url ?? "",
    requirements: h.requirements ?? "",
    image_url: h.image_url ?? "",
    status: h.status,
  };
}

export default function AdminHackathonList({
  hackathons: initialHackathons,
  userId,
}: AdminHackathonListProps) {
  const router = useRouter();
  const supabase = createClient();

  const [hackathons, setHackathons] = useState(initialHackathons);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HackathonForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(h: Hackathon) {
    setEditingId(h.id);
    setForm(hackathonToForm(h));
    setError(null);
    setDialogOpen(true);
  }

  function updateField<K extends keyof HackathonForm>(
    key: K,
    value: HackathonForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      organizer: form.organizer || null,
      description: form.description || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      registration_deadline: form.registration_deadline || null,
      modality: form.modality,
      location_city: form.location_city || null,
      location_country: form.location_country || null,
      category: form.category || null,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      prize_pool: form.prize_pool || null,
      official_url: form.official_url || null,
      requirements: form.requirements || null,
      image_url: form.image_url || null,
      status: form.status,
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("hackathons")
        .update(payload)
        .eq("id", editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setHackathons((prev) =>
        prev.map((h) =>
          h.id === editingId ? { ...h, ...payload } as Hackathon : h
        )
      );
    } else {
      const { data, error: insertError } = await supabase
        .from("hackathons")
        .insert({ ...payload, created_by: userId })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setHackathons((prev) => [data as Hackathon, ...prev]);
    }

    setDialogOpen(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this hackathon?")) return;

    const { error } = await supabase
      .from("hackathons")
      .delete()
      .eq("id", id);

    if (!error) {
      setHackathons((prev) => prev.filter((h) => h.id !== id));
    }
  }

  async function toggleFeatured(h: Hackathon) {
    const { error } = await supabase
      .from("hackathons")
      .update({ is_featured: !h.is_featured })
      .eq("id", h.id);

    if (!error) {
      setHackathons((prev) =>
        prev.map((item) =>
          item.id === h.id
            ? { ...item, is_featured: !item.is_featured }
            : item
        )
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />
          Create Hackathon
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Modality</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hackathons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hackathons yet. Create the first one!
                </TableCell>
              </TableRow>
            ) : (
              hackathons.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        h.status === "active"
                          ? "default"
                          : h.status === "upcoming"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {h.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{h.modality}</TableCell>
                  <TableCell>{h.category ?? "-"}</TableCell>
                  <TableCell>
                    {h.is_featured ? (
                      <Badge variant="default">Featured</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleFeatured(h)}
                        title={
                          h.is_featured ? "Remove featured" : "Set featured"
                        }
                      >
                        {h.is_featured ? (
                          <StarOff className="h-4 w-4" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(h)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(h.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Hackathon" : "Create Hackathon"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the hackathon details below."
                : "Fill in the details to create a new hackathon."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Hackathon name"
              />
            </div>

            <div className="space-y-2">
              <Label>Organizer</Label>
              <Input
                value={form.organizer}
                onChange={(e) => updateField("organizer", e.target.value)}
                placeholder="Organization name"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe the hackathon..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField("start_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateField("end_date", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Registration Deadline</Label>
              <Input
                type="date"
                value={form.registration_deadline}
                onChange={(e) =>
                  updateField("registration_deadline", e.target.value)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Modality</Label>
                <Select
                  value={form.modality}
                  onValueChange={(v) =>
                    updateField(
                      "modality",
                      v as "remote" | "in-person" | "hybrid"
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="in-person">In-person</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    updateField(
                      "status",
                      v as "upcoming" | "active" | "past"
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={form.location_city}
                  onChange={(e) =>
                    updateField("location_city", e.target.value)
                  }
                  placeholder="San Francisco"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  value={form.location_country}
                  onChange={(e) =>
                    updateField("location_country", e.target.value)
                  }
                  placeholder="United States"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField("category", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {HACKATHON_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => updateField("tags", e.target.value)}
                placeholder="ai, web3, defi"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prize Pool</Label>
                <Input
                  value={form.prize_pool}
                  onChange={(e) => updateField("prize_pool", e.target.value)}
                  placeholder="$10,000"
                />
              </div>
              <div className="space-y-2">
                <Label>Official URL</Label>
                <Input
                  value={form.official_url}
                  onChange={(e) =>
                    updateField("official_url", e.target.value)
                  }
                  placeholder="https://hackathon.example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea
                value={form.requirements}
                onChange={(e) => updateField("requirements", e.target.value)}
                placeholder="Entry requirements..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={form.image_url}
                onChange={(e) => updateField("image_url", e.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
