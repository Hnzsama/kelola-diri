"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Add01Icon, Delete02Icon, PencilEdit01Icon, Mail01Icon, CallIcon, OfficeIcon } from "@hugeicons/core-free-icons";

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  notes?: string;
  _count?: {
    projects: number;
  };
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  // Form States
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/career/clients");
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setClients(data);
    } catch {
      toast.error("Gagal memuat data klien");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setNotes("");
    setIsOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditId(client.id);
    setName(client.name);
    setCompany(client.company);
    setEmail(client.email);
    setPhone(client.phone);
    setNotes(client.notes || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !email || !phone) {
      toast.error("Kolom wajib harus diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editId ? `/api/career/clients/${editId}` : "/api/career/clients";
      const method = editId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, phone, notes }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Terjadi kesalahan");
      } else {
        toast.success(editId ? "Klien berhasil diperbarui!" : "Klien berhasil ditambahkan!");
        setIsOpen(false);
        fetchClients();
      }
    } catch {
      toast.error("Gagal menyimpan data klien");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus klien ini? Semua proyek terkait klien ini juga akan ikut terhapus!")) return;
    
    try {
      const res = await fetch(`/api/career/clients/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal menghapus klien");
      } else {
        toast.success("Klien berhasil dihapus");
        fetchClients();
      }
    } catch {
      toast.error("Gagal menghapus klien");
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="w-full px-4 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight font-mono uppercase">Manajemen Klien</h1>
          <p className="text-muted-foreground font-mono text-xs">
            Kelola data kontak klien freelance untuk kelancaran pengerjaan proyek dan penagihan invoice.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-3 border-2 border-border font-bold text-sm uppercase tracking-wider bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer shrink-0"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-4" />
          <span>Tambah Klien</span>
        </button>
      </div>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div className="border-2 border-dashed border-border p-12 text-center font-mono">
          <HugeiconsIcon icon={UserGroupIcon} className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-extrabold uppercase text-sm mb-1">Klien Kosong</h3>
          <p className="text-xs text-muted-foreground mb-6">Mulai tambahkan kontak klien freelance Anda untuk mengaitkan proyek baru.</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 border-2 border-border bg-yellow-400 text-black font-bold text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-[1px] cursor-pointer"
          >
            Daftarkan Klien Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] font-mono flex flex-col justify-between">
              <div className="space-y-4">
                {/* Client Avatar Header */}
                <div className="flex justify-between items-start border-b border-border/20 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base truncate max-w-[180px]">{client.name}</h3>
                    <span className="text-[10px] bg-cyan-400/10 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 border border-cyan-400/30 uppercase font-black">
                      {client.company}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1.5 border border-border bg-background hover:bg-muted text-foreground cursor-pointer"
                      title="Edit Klien"
                    >
                      <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 border border-rose-500 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer transition-all"
                      title="Hapus Klien"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Mail01Icon} className="size-3.5 text-muted-foreground" />
                    <a href={`mailto:${client.email}`} className="hover:underline truncate">{client.email}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={CallIcon} className="size-3.5 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                  {client.notes && (
                    <div className="border border-border/40 p-2.5 bg-muted/20 text-[10px] text-muted-foreground rounded-none leading-relaxed">
                      💡 {client.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Stat */}
              <div className="mt-6 pt-3 border-t border-border/10 flex justify-between items-center text-[10px] text-muted-foreground">
                <span className="uppercase font-bold">Frekuensi Kerja</span>
                <span className="font-bold text-foreground bg-muted border border-border px-2 py-0.5">
                  {client._count?.projects || 0} Proyek
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD MODAL DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="border-3 border-border bg-card p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-md font-mono relative">
            <h3 className="font-extrabold text-sm uppercase border-b border-border/20 pb-2 mb-4">
              {editId ? "📝 Edit Profil Klien" : "➕ Daftarkan Klien Baru"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nama Klien *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Perusahaan / Instansi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Kreatif Digital"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Email Klien *</label>
                <input
                  type="email"
                  required
                  placeholder="johndoe@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Nomor Telepon *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  placeholder="Klien ini biasanya meminta revisi di akhir pekan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-border bg-background p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-2.5 border-2 border-border bg-background text-foreground hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 border-2 border-border bg-primary text-primary-foreground font-bold text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:-translate-y-[1px] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Klien"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
