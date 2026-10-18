import React, { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Badge, Spinner, useToast } from '@idds/react';
import { IconPlus, IconDatabaseImport } from '@tabler/icons-react';
import { useAuth } from './context/AuthContext';
import { incidentApi } from './services/api';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import IncidentStats from './components/IncidentStats';
import IncidentList from './components/IncidentList';
import IncidentDetailModal from './components/IncidentDetailModal';
import IncidentFormModal from './components/IncidentFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

export default function App() {
  const { user, authLoading, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  // State daftar catatan gangguan & ringkasan
  const [incidents, setIncidents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // State filter & halaman
  const [filters, setFilters] = useState({
    search: '',
    kategori: 'SEMUA',
    status: 'SEMUA',
    prioritas: 'SEMUA',
    sortBy: 'tanggal_kejadian',
    sortOrder: 'desc',
    page: 1,
    limit: 20,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // State umpan balik banner global (berhasil / gagal)
  const [bannerFeedback, setBannerFeedback] = useState(null);

  // State modal Detail
  const [detailTarget, setDetailTarget] = useState(null);

  // State modal Tambah / Ubah
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [editingItem, setEditingItem] = useState(null);
  const [suggestedCode, setSuggestedCode] = useState('INC-2026-021');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formServerError, setFormServerError] = useState('');
  const [formFieldErrors, setFormFieldErrors] = useState({});

  // State modal Konfirmasi Hapus
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // State pemulihan 20 data contoh
  const [reseeding, setReseeding] = useState(false);

  const fetchIncidents = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setListError('');

    try {
      const res = await incidentApi.list(filters);
      setIncidents(res.data || []);
      setPagination(
        res.pagination || {
          page: filters.page,
          limit: filters.limit,
          total: (res.data || []).length,
          totalPages: 1,
        }
      );
      setSummary(res.summary || null);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setListError(err.message || 'Gagal memuat daftar catatan gangguan TI.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filters, logout]);

  const fetchMetaCode = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await incidentApi.getMeta();
      if (res.data?.suggestedCode) {
        setSuggestedCode(res.data.suggestedCode);
      }
    } catch {
      // Abaikan jika gagal memuat saran kode
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchIncidents();
      fetchMetaCode();
    }
  }, [isAuthenticated, fetchIncidents, fetchMetaCode]);

  const handleFilterChange = (partial) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      page: 1, // Kembali ke halaman 1 setiap kali filter diubah
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      kategori: 'SEMUA',
      status: 'SEMUA',
      prioritas: 'SEMUA',
      sortBy: 'tanggal_kejadian',
      sortOrder: 'desc',
      page: 1,
      limit: filters.limit,
    });
  };

  const handleOpenCreate = async () => {
    setFormMode('create');
    setEditingItem(null);
    setFormServerError('');
    setFormFieldErrors({});
    setFormOpen(true);
    await fetchMetaCode();
  };

  const handleOpenEdit = (item) => {
    setFormMode('edit');
    setEditingItem(item);
    setFormServerError('');
    setFormFieldErrors({});
    setFormOpen(true);
  };

  const handleClearFieldError = (field) => {
    setFormFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handleFormSubmit = async (formData) => {
    setFormSubmitting(true);
    setFormServerError('');
    setFormFieldErrors({});

    try {
      let res;
      if (formMode === 'edit' && editingItem) {
        res = await incidentApi.update(editingItem.id, formData);
      } else {
        res = await incidentApi.create(formData);
      }

      setFormOpen(false);
      setBannerFeedback({
        variant: 'success',
        title: formMode === 'edit' ? 'Perubahan Berhasil Disimpan' : 'Catatan Baru Berhasil Ditambahkan',
        message: res.message,
      });

      toast({
        state: 'positive',
        style: 'solid',
        title: formMode === 'edit' ? 'Berhasil Diperbarui' : 'Berhasil Ditambahkan',
        description: res.message,
        position: 'top-right',
        duration: 4500,
      });

      await fetchIncidents();
      await fetchMetaCode();
    } catch (err) {
      setFormServerError(
        err.message || 'Validasi gagal. Mohon periksa kembali isian formulir Anda.'
      );
      if (err.errors) {
        setFormFieldErrors(err.errors);
      }

      toast({
        state: 'destructive',
        style: 'solid',
        title: 'Gagal Menyimpan Data',
        description: err.message || 'Periksa pesan kesalahan pada formulir.',
        position: 'top-right',
        duration: 4500,
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDelete = (item) => {
    setDeleteError('');
    setDeleteTarget(item);
  };

  const handleConfirmDelete = async (id) => {
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await incidentApi.remove(id);
      setDeleteTarget(null);

      setBannerFeedback({
        variant: 'success',
        title: 'Data Berhasil Dihapus',
        message: res.message,
      });

      toast({
        state: 'positive',
        style: 'solid',
        title: 'Berhasil Dihapus',
        description: res.message,
        position: 'top-right',
        duration: 4500,
      });

      await fetchIncidents();
      await fetchMetaCode();
    } catch (err) {
      setDeleteError(err.message || 'Gagal menghapus catatan gangguan.');
      toast({
        state: 'destructive',
        style: 'solid',
        title: 'Gagal Menghapus',
        description: err.message || 'Terjadi kesalahan saat menghapus data.',
        position: 'top-right',
        duration: 4500,
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleReseedSample = async () => {
    setReseeding(true);
    try {
      const res = await incidentApi.reseedSample();
      setBannerFeedback({
        variant: 'info',
        title: 'Data Contoh Dipulihkan',
        message: res.message,
      });
      toast({
        state: 'positive',
        style: 'solid',
        title: '20 Data Contoh Tersedia',
        description: res.message,
        position: 'top-right',
        duration: 4000,
      });
      await fetchIncidents();
      await fetchMetaCode();
    } catch (err) {
      toast({
        state: 'destructive',
        style: 'solid',
        title: 'Gagal Memuat Data Contoh',
        description: err.message,
        position: 'top-right',
        duration: 4000,
      });
    } finally {
      setReseeding(false);
    }
  };

  // Keadaan sedang memuat sesi autentikasi awal
  if (authLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 gap-3"
      >
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-700">
          Memverifikasi sesi keamanan SIGAP-TI...
        </p>
      </div>
    );
  }

  // Halaman autentikasi jika belum masuk
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        user={user}
        onLogout={logout}
        onOpenCreate={handleOpenCreate}
        onRefresh={fetchIncidents}
        isRefreshing={loading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Header & Tombol Aksi Utama */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="brand" type="soft" size="sm">
                Pusat Kendali Insiden TI
              </Badge>
              <Badge variant="success" type="soft" size="sm">
                PostgreSQL Persisten Aktif
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Manajemen Catatan Gangguan Teknologi Informasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Pantau, tambahkan, perbarui, dan evaluasi seluruh insiden gangguan layanan TI secara
              real-time dengan antarmuka standar INA Digital Design System.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              hierarchy="secondary"
              size="md"
              disabled={reseeding}
              onClick={handleReseedSample}
              prefixIcon={
                reseeding ? <Spinner size="sm" /> : <IconDatabaseImport size={17} />
              }
              title="Pastikan 20 data contoh awal tersedia di database"
            >
              {reseeding ? 'Memastikan Data...' : 'Pastikan 20 Data Contoh'}
            </Button>

            <Button
              type="button"
              hierarchy="primary"
              size="md"
              onClick={handleOpenCreate}
              prefixIcon={<IconPlus size={18} />}
            >
              Tambah Catatan Gangguan
            </Button>
          </div>
        </div>

        {/* Umpan Balik Banner Operasi CRUD (Berhasil / Info / Gagal) */}
        {bannerFeedback && (
          <div className="mb-6" role="status" aria-live="polite">
            <Alert
              variant={bannerFeedback.variant}
              title={bannerFeedback.title}
              message={bannerFeedback.message}
              dismissible
              onDismiss={() => setBannerFeedback(null)}
            />
          </div>
        )}

        {/* Kartu Ringkasan Statistik */}
        <IncidentStats summary={summary} loading={loading} />

        {/* Daftar Data Gangguan & Filter */}
        <IncidentList
          incidents={incidents}
          loading={loading}
          error={listError}
          filters={filters}
          pagination={pagination}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          onPageChange={(newPage) => setFilters((prev) => ({ ...prev, page: newPage }))}
          onPageSizeChange={(newLimit) =>
            setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }))
          }
          onViewDetail={(item) => setDetailTarget(item)}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
          onOpenCreate={handleOpenCreate}
          onReseedSample={handleReseedSample}
          reseeding={reseeding}
          onRetry={fetchIncidents}
        />
      </main>

      {/* Footer Standar INA Digital */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <strong>SIGAP-TI</strong> — Sistem Catatan Gangguan TI berbasis{' '}
            <a
              href="https://design.inadigital.go.id/"
              target="_blank"
              rel="noreferrer"
              className="text-red-700 hover:underline font-medium"
            >
              INA Digital Design System (IDDS)
            </a>
          </div>
          <div>Backend Node.js (Express) • Database PostgreSQL • React &amp; Tailwind CSS</div>
        </div>
      </footer>

      {/* Modal Detail Satu Data */}
      <IncidentDetailModal
        open={Boolean(detailTarget)}
        incidentId={detailTarget?.id}
        initialData={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Modal Tambah / Ubah Data */}
      <IncidentFormModal
        open={formOpen}
        mode={formMode}
        initialData={editingItem}
        suggestedCode={suggestedCode}
        defaultReporter={
          user ? `${user.nama_lengkap} (${user.peran})` : 'Petugas Operasional TI'
        }
        submitting={formSubmitting}
        serverError={formServerError}
        fieldErrors={formFieldErrors}
        onClearFieldError={handleClearFieldError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Modal Konfirmasi Penghapusan */}
      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        incident={deleteTarget}
        deleting={deleting}
        error={deleteError}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

