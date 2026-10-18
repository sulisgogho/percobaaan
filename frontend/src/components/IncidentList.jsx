import React from 'react';
import {
  Button,
  Badge,
  TextField,
  SelectDropdown,
  Pagination,
  Skeleton,
  Spinner,
  Alert,
} from '@idds/react';
import {
  IconSearch,
  IconEye,
  IconEdit,
  IconTrash,
  IconFilterOff,
  IconPlus,
  IconDatabaseImport,
  IconCalendar,
  IconClock,
  IconUsers,
  IconServer,
  IconLayoutGrid,
  IconTable,
  IconInboxOff,
} from '@tabler/icons-react';
import {
  FILTER_KATEGORI_OPTIONS,
  FILTER_STATUS_OPTIONS,
  FILTER_PRIORITAS_OPTIONS,
  SORT_OPTIONS,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  getCategoryBadgeVariant,
  formatDateIndo,
  formatDurationMinutes,
} from '../constants/incidentOptions';

export default function IncidentList({
  incidents,
  loading,
  error,
  filters,
  pagination,
  viewMode, // 'table' | 'cards'
  onViewModeChange,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onEdit,
  onDelete,
  onOpenCreate,
  onReseedSample,
  reseeding,
  onRetry,
}) {
  const hasActiveFilters =
    Boolean(filters.search?.trim()) ||
    (filters.kategori && filters.kategori !== 'SEMUA') ||
    (filters.status && filters.status !== 'SEMUA') ||
    (filters.prioritas && filters.prioritas !== 'SEMUA');

  const sortValue = `${filters.sortBy}:${filters.sortOrder}`;

  return (
    <section aria-label="Daftar Catatan Gangguan TI" className="space-y-4">
      {/* Panel Pencarian & Filter Responsif */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Daftar Catatan Gangguan TI
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan{' '}
              <strong className="text-slate-800">{incidents.length}</strong> dari total{' '}
              <strong className="text-slate-800">{pagination.total}</strong> catatan yang sesuai
              filter
            </p>
          </div>

          {/* Pengaturan Mode Tampilan & Reset Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <Button
                type="button"
                hierarchy="secondary"
                size="sm"
                onClick={onResetFilters}
                prefixIcon={<IconFilterOff size={15} />}
              >
                Reset Filter
              </Button>
            )}

            <div
              className="hidden md:inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100"
              role="group"
              aria-label="Pilih tata letak daftar"
            >
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-red-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={viewMode === 'table'}
              >
                <IconTable size={15} />
                <span>Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-red-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={viewMode === 'cards'}
              >
                <IconLayoutGrid size={15} />
                <span>Kartu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Input Filter dengan Label Jelas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-2 lg:col-span-4">
            <TextField
              id="filter-search"
              name="search"
              label="Cari Catatan Gangguan"
              placeholder="Cari kode (INC-2026-...), judul, sistem, atau pelapor..."
              prefixIcon={<IconSearch size={16} className="text-slate-400" />}
              value={filters.search}
              onChange={(val) => onFilterChange({ search: val })}
              onClear={() => onFilterChange({ search: '' })}
              showClearButton
            />
          </div>

          <div className="lg:col-span-3">
            <SelectDropdown
              label="Filter Kategori"
              options={FILTER_KATEGORI_OPTIONS}
              selected={filters.kategori}
              onSelect={(val) => onFilterChange({ kategori: val || 'SEMUA' })}
              placeholder="Semua Kategori"
              searchable={false}
              showPreviewValue={false}
              width="100%"
            />
          </div>

          <div className="lg:col-span-2">
            <SelectDropdown
              label="Filter Status"
              options={FILTER_STATUS_OPTIONS}
              selected={filters.status}
              onSelect={(val) => onFilterChange({ status: val || 'SEMUA' })}
              placeholder="Semua Status"
              searchable={false}
              showPreviewValue={false}
              width="100%"
            />
          </div>

          <div className="lg:col-span-3">
            <SelectDropdown
              label="Urutkan Berdasarkan"
              options={SORT_OPTIONS}
              selected={sortValue}
              onSelect={(val) => {
                if (!val) return;
                const [sortBy, sortOrder] = String(val).split(':');
                onFilterChange({ sortBy, sortOrder });
              }}
              placeholder="Urutkan"
              searchable={false}
              showPreviewValue={false}
              width="100%"
            />
          </div>
        </div>

        {/* Filter Cepat Prioritas menggunakan Tombol Aksesibel Keyboard */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 mr-1">Filter Prioritas:</span>
          {FILTER_PRIORITAS_OPTIONS.map((opt) => {
            const active = filters.prioritas === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange({ prioritas: opt.value })}
                aria-pressed={active}
                className={`px-3 py-1 rounded-full text-xs font-medium transition border cursor-pointer ${
                  active
                    ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. UMPAN BALIK KEADAAN GAGAL (ERROR STATE) */}
      {error && (
        <div role="alert" className="bg-white rounded-2xl border border-red-200 p-4 space-y-3">
          <Alert
            variant="critical"
            title="Gagal Memuat Data Gangguan TI"
            message={error}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              hierarchy="primary"
              size="sm"
              onClick={onRetry}
            >
              Coba Muat Ulang
            </Button>
          </div>
        </div>
      )}

      {/* 2. UMPAN BALIK KEADAAN SEDANG MEMUAT (LOADING STATE) */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
        >
          <div className="flex items-center justify-center gap-3 py-2 text-slate-700">
            <Spinner size="md" />
            <span className="text-sm font-medium">
              Sedang memuat data catatan gangguan TI dari PostgreSQL...
            </span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2"
              >
                <div className="flex justify-between gap-4">
                  <Skeleton height={20} width="25%" />
                  <Skeleton height={20} width="15%" />
                </div>
                <Skeleton height={18} width="70%" />
                <Skeleton height={14} width="45%" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. UMPAN BALIK KEADAAN DATA KOSONG (EMPTY STATE) */}
      {!loading && !error && incidents.length === 0 && (
        <div
          role="status"
          className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-2xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <IconInboxOff size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {hasActiveFilters
              ? 'Tidak Ada Catatan Gangguan yang Sesuai Filter'
              : 'Belum Ada Data Catatan Gangguan TI'}
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            {hasActiveFilters
              ? 'Coba ubah kata kunci pencarian atau atur ulang filter kategori, status, dan prioritas untuk melihat seluruh data.'
              : 'Basis data saat ini kosong. Anda dapat menambahkan catatan gangguan baru atau memulihkan 20 data contoh standar.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {hasActiveFilters ? (
              <Button
                type="button"
                hierarchy="primary"
                size="md"
                onClick={onResetFilters}
                prefixIcon={<IconFilterOff size={16} />}
              >
                Tampilkan Semua Data (Reset Filter)
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  hierarchy="primary"
                  size="md"
                  onClick={onOpenCreate}
                  prefixIcon={<IconPlus size={16} />}
                >
                  Tambah Catatan Gangguan Baru
                </Button>
                <Button
                  type="button"
                  hierarchy="secondary"
                  size="md"
                  disabled={reseeding}
                  onClick={onReseedSample}
                  prefixIcon={
                    reseeding ? <Spinner size="sm" /> : <IconDatabaseImport size={16} />
                  }
                >
                  {reseeding ? 'Memulihkan Data...' : 'Muat 20 Data Contoh'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. DAFTAR DATA (TABEL DESKTOP & KARTU RESPONSIF PONSEL/TABLET) */}
      {!loading && !error && incidents.length > 0 && (
        <>
          {/* Tampilan Tabel pada Layar Komputer (Desktop) jika viewMode === 'table' */}
          {viewMode === 'table' && (
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4">Kode &amp; Tanggal</th>
                      <th className="py-3.5 px-4">Judul &amp; Sistem Terdampak</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Prioritas &amp; Status</th>
                      <th className="py-3.5 px-4">Downtime &amp; Dampak</th>
                      <th className="py-3.5 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {incidents.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/90 transition-colors group"
                      >
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="font-mono font-bold text-xs text-red-700 bg-red-50 border border-red-200/70 inline-block px-2 py-0.5 rounded-md mb-1">
                            {item.kode_gangguan}
                          </div>
                          <div className="text-xs text-slate-600 flex items-center gap-1">
                            <IconCalendar size={13} className="text-slate-400" />
                            <span>{formatDateIndo(item.tanggal_kejadian)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top max-w-md">
                          <button
                            type="button"
                            onClick={() => onViewDetail(item)}
                            className="text-left font-semibold text-slate-900 hover:text-red-700 transition line-clamp-2 cursor-pointer"
                          >
                            {item.judul}
                          </button>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="inline-flex items-center gap-1">
                              <IconServer size={13} className="text-slate-400" />
                              {item.sistem_terdampak}
                            </span>
                            <span>• Pelapor: {item.pelapor}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <Badge
                            variant={getCategoryBadgeVariant(item.kategori)}
                            type="soft"
                            size="md"
                          >
                            {item.kategori}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1.5">
                            <Badge
                              variant={getStatusBadgeVariant(item.status)}
                              type="fill"
                              size="sm"
                            >
                              {item.status}
                            </Badge>
                            <Badge
                              variant={getPriorityBadgeVariant(item.prioritas)}
                              type="soft"
                              size="sm"
                            >
                              Prioritas: {item.prioritas}
                            </Badge>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-xs text-slate-700">
                          <div className="flex items-center gap-1.5 font-medium">
                            <IconClock size={14} className="text-amber-600" />
                            <span>{item.durasi_downtime} menit</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                            <IconUsers size={14} className="text-blue-600" />
                            <span>
                              {Number(item.jumlah_pengguna_terdampak || 0).toLocaleString('id-ID')}{' '}
                              pengguna
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 align-top whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              hierarchy="secondary"
                              size="sm"
                              onClick={() => onViewDetail(item)}
                              prefixIcon={<IconEye size={15} />}
                              aria-label={`Lihat detail ${item.kode_gangguan}`}
                            >
                              Detail
                            </Button>
                            <Button
                              type="button"
                              hierarchy="secondary"
                              size="sm"
                              onClick={() => onEdit(item)}
                              prefixIcon={<IconEdit size={15} />}
                              aria-label={`Ubah data ${item.kode_gangguan}`}
                            >
                              Ubah
                            </Button>
                            <Button
                              type="button"
                              hierarchy="tertiary"
                              size="sm"
                              onClick={() => onDelete(item)}
                              prefixIcon={<IconTrash size={15} className="text-red-600" />}
                              aria-label={`Hapus data ${item.kode_gangguan}`}
                            >
                              <span className="text-red-600 font-medium">Hapus</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tampilan Kartu Responsif (Otomatis aktif di Ponsel, atau saat mode 'cards' di Desktop) */}
          <div
            className={`${
              viewMode === 'cards'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : 'grid grid-cols-1 gap-3.5 md:hidden'
            }`}
          >
            {incidents.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-slate-300 transition"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                      {item.kode_gangguan}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={getStatusBadgeVariant(item.status)}
                        type="fill"
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                      <Badge
                        variant={getPriorityBadgeVariant(item.prioritas)}
                        type="soft"
                        size="sm"
                      >
                        {item.prioritas}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Badge
                      variant={getCategoryBadgeVariant(item.kategori)}
                      type="soft"
                      size="sm"
                    >
                      {item.kategori}
                    </Badge>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                      <button
                        type="button"
                        onClick={() => onViewDetail(item)}
                        className="text-left hover:text-red-700 transition cursor-pointer"
                      >
                        {item.judul}
                      </button>
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {item.deskripsi}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <IconCalendar size={14} className="text-slate-400 shrink-0" />
                      <span>{formatDateIndo(item.tanggal_kejadian)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <IconClock size={14} className="text-amber-600 shrink-0" />
                      <span>{formatDurationMinutes(item.durasi_downtime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <IconServer size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">Sistem: {item.sistem_terdampak}</span>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Kartu (Nyaman disentuh di ponsel & diakses dengan keyboard) */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    hierarchy="secondary"
                    size="sm"
                    onClick={() => onViewDetail(item)}
                    prefixIcon={<IconEye size={15} />}
                    aria-label={`Lihat detail ${item.kode_gangguan}`}
                  >
                    Detail
                  </Button>
                  <Button
                    type="button"
                    hierarchy="secondary"
                    size="sm"
                    onClick={() => onEdit(item)}
                    prefixIcon={<IconEdit size={15} />}
                    aria-label={`Ubah ${item.kode_gangguan}`}
                  >
                    Ubah
                  </Button>
                  <Button
                    type="button"
                    hierarchy="tertiary"
                    size="sm"
                    onClick={() => onDelete(item)}
                    prefixIcon={<IconTrash size={15} className="text-red-600" />}
                    aria-label={`Hapus ${item.kode_gangguan}`}
                  >
                    <span className="text-red-600 font-medium">Hapus</span>
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {/* Navigasi Halaman menggunakan Komponen IDDS Pagination */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.limit}
              pageSizeOptions={[5, 10, 20, 50]}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              disabled={loading}
              fullWidth
            />
          </div>
        </>
      )}
    </section>
  );
}

