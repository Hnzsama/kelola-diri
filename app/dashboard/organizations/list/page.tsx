"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { useConfirm } from "@/components/ui/confirm-modal";
import { CardGridSkeleton } from "@/components/ui/page-skeleton";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  period: string | null;
  logoIcon: string;
  members: { id: string }[];
  events: { id: string }[];
}

interface Membership {
  id: string;
  role: string;
  position: string | null;
  period: string | null;
  organization: Organization;
}

const LOGO_ICONS = ["🏢", "💻", "🏛️", "🎓", "🎨", "⚽", "🎵", "🌿", "🔬", "📰", "🤝", "🚀"];
const ROLE_OPTIONS = ["MEMBER", "CHAIR", "SECRETARY", "TREASURER"];

export default function OrgListPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { confirmModal, openConfirm } = useConfirm();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [period, setPeriod] = useState("2025–2026");
  const [logoIcon, setLogoIcon] = useState("🏢");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("MEMBER");

  useEffect(() => { fetchMemberships(); }, []);

  const fetchMemberships = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/organizations");
      if (!res.ok) throw new Error("Gagal");
      setMemberships(await res.json());
    } catch { toast.error("Gagal memuat daftar organisasi"); }
    finally { setIsLoading(false); }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setDescription(""); setPeriod("2025–2026");
    setLogoIcon("🏢"); setPosition(""); setRole("MEMBER");
    setIsFormOpen(false);
  };

  const handleEdit = (m: Membership) => {
    setEditingId(m.organization.id);
    setName(m.organization.name);
    setDescription(m.organization.description || "");
    setPeriod(m.organization.period || "2025–2026");
    setLogoIcon(m.organization.logoIcon);
    setPosition(m.position || "");
    setRole(m.role);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nama organisasi wajib diisi!"); return; }
    setIsSaving(true);
    try {
      const url = editingId ? `/api/organizations/${editingId}` : "/api/organizations";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, period, logoIcon, position, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      toast.success(editingId ? "Organisasi diperbarui!" : "Organisasi berhasil ditambahkan!");
      resetForm();
      fetchMemberships();
    } catch (e: any) { toast.error(e.message || "Gagal menyimpan"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (orgId: string, orgName: string) => {
    const ok = await openConfirm({
      title: "Keluar dari Organisasi",
      message: `Keluar dari "${orgName}"?\n\nData keanggotaan Anda akan dihapus, namun riwayat agenda tetap tersimpan.`,
      confirmLabel: "Ya, Keluar",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/organizations/${orgId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Berhasil keluar dari organisasi");
      fetchMemberships();
    } catch (e: any) { toast.error(e.message || "Gagal"); }
  };

  if (isLoading) return <CardGridSkeleton count={3} />;

  return (
    <div className="w-full px-4 lg:px-6">
      {/* Confirm Modal */}
      {confirmModal}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Daftar Organisasi</h1>
          <p className="text-muted-foreground">Kelola keanggotaan dan data organisasi kampus Anda.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Tambah Organisasi
        </button>
      </div>

      {/* FORM */}
      {isFormOpen && (
        <div className="mb-8 border-2 border-border bg-card p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]">
          <h2 className="text-xl font-bold uppercase font-mono mb-4">{editingId ? "Edit Organisasi" : "Tambah Organisasi Baru"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Field>
              <FieldLabel>Nama Organisasi *</FieldLabel>
              <Input placeholder="Contoh: HIMA Teknik Informatika" value={name} onChange={e => setName(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel>Jabatan Anda</FieldLabel>
              <Input placeholder="Contoh: Staff Divisi IT" value={position} onChange={e => setPosition(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Periode Kepengurusan</FieldLabel>
              <Input placeholder="Contoh: 2025–2026" value={period} onChange={e => setPeriod(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Level Kepengurusan</FieldLabel>
              <select value={role} onChange={e => setRole(e.target.value)} className="flex h-10 w-full border-2 border-border bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus-visible:outline-hidden">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r === "CHAIR" ? "Ketua" : r === "SECRETARY" ? "Sekretaris" : r === "TREASURER" ? "Bendahara" : "Anggota"}</option>)}
              </select>
            </Field>
            <Field className="md:col-span-2">
              <FieldLabel>Deskripsi Singkat</FieldLabel>
              <Input placeholder="Tentang organisasi ini..." value={description} onChange={e => setDescription(e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <FieldLabel>Logo / Ikon</FieldLabel>
              <div className="flex flex-wrap gap-2 mt-1.5 p-2 border border-border bg-muted/20">
                {LOGO_ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setLogoIcon(icon)}
                    className={`size-9 flex items-center justify-center text-xl border-2 transition-all ${logoIcon === icon ? "border-primary bg-primary/10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]" : "border-transparent hover:border-border"}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <Button type="submit" disabled={isSaving} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                {isSaving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      {memberships.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
          <p className="text-muted-foreground font-mono text-sm mb-4">Belum ada organisasi terdaftar.</p>
          <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 border-2 border-border font-bold text-xs uppercase bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] transition-all">Tambah Sekarang</button>
        </div>
      ) : (
        <div className="border-2 border-border bg-card shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] p-6">
          <h3 className="font-mono font-extrabold text-sm uppercase tracking-wider mb-4 border-b border-border/20 pb-3">
            📋 Keanggotaan Organisasi ({memberships.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono border-collapse">
              <thead>
                <tr className="border-b-2 border-border bg-muted/40 text-xs font-bold uppercase select-none">
                  <th className="p-3">Organisasi</th>
                  <th className="p-3">Jabatan</th>
                  <th className="p-3 text-center">Level</th>
                  <th className="p-3 text-center">Periode</th>
                  <th className="p-3 text-center">Agenda Aktif</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-border/20">
                {memberships.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{m.organization.logoIcon}</span>
                        <div>
                          <p className="font-bold uppercase">{m.organization.name}</p>
                          {m.organization.description && <p className="text-muted-foreground text-[10px] max-w-[200px] truncate">{m.organization.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-primary">{m.position || "—"}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 border border-border text-[10px] font-bold uppercase bg-muted/30">
                        {m.role === "CHAIR" ? "Ketua" : m.role === "SECRETARY" ? "Sekretaris" : m.role === "TREASURER" ? "Bendahara" : "Anggota"}
                      </span>
                    </td>
                    <td className="p-3 text-center text-muted-foreground">{m.organization.period || "—"}</td>
                    <td className="p-3 text-center font-bold">{m.organization.events.length}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(m)} className="px-2.5 py-1 border-2 border-border font-bold text-[10px] uppercase bg-background shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all">Edit</button>
                        <button onClick={() => handleDelete(m.organization.id, m.organization.name)} className="px-2.5 py-1 border-2 border-destructive font-bold text-[10px] uppercase bg-destructive/10 text-destructive shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)] transition-all">Keluar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
