import React, { useEffect, useState } from 'react';
import { Modal, Button, Badge, Alert, Divider, Spinner } from '@idds/react';
import {
  IconCalendarEvent,
  IconClock,
  IconUsers,
  IconCoin,
  IconServer,
  IconUserCheck,
  IconUserExclamation,
  IconEdit,
  IconTrash,
  IconTool,
  IconZoomQuestion,
  IconFileDescription,
} from '@tabler/icons-react';
import { incidentApi } from '../services/api';
import {
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
  getCategoryBadgeVariant,
  formatDateIndo,
  formatCurrencyIDR,
  formatDurationMinutes,
} from '../constants/incidentOptions';

export default function IncidentDetailModal({
  open,
  incidentId,
  initialData,
  onClose,
  onEdit,
  onDelete,
}) {
  const [detail, setDetail] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !incidentId) return;

    let isMounted = true;
    setDetail(initialData || null);
    setLoading(true);
    setError('');

    incidentApi
      .getById(incidentId)
      .then((res) => {
        if (isMounted) {
          setDetail(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Gagal memuat detail catatan gangguan TI.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, incidentId, initialData]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900">Detail Catatan Gangguan TI</span>
          {detail?.kode_gangguan && (
            <Badge variant="brand" type="soft" size="md">
              {detail.kode_gangguan}
            </Badge>
          )}
        </div>
      }
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700"
          >
            <Spinner size="sm" />
            <span>Memuat rincian terbaru dari database PostgreSQL...</span>
          </div>
        )}

        {error && (
          <Alert
            variant="critical"
            title="Gagal Memuat Detail"
            message={error}
            dismissible
            onDismiss={() => setError('')}
          />
        )}

        {detail && (
          <>
            {/* Header Status, Kategori & Prioritas */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <Badge variant={getStatusBadgeVariant(detail.status)} type="fill" size="md">
                  Status: {detail.status}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(detail.prioritas)} type="soft" size="md">
                  Prioritas: {detail.prioritas}
                </Badge>
                <Badge variant={getCategoryBadgeVariant(detail.kategori)} type="soft" size="md">
                  Kategori: {detail.kategori}
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {detail.judul}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ID Database: #{detail.id} • Kode Unik: {detail.kode_gangguan}
              </p>
            </div>

            {/* Grid Metrik Kuantitatif & Informasi Operasional */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <IconCalendarEvent size={15} className="text-red-600" />
                  <span>Tanggal Kejadian</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatDateIndo(detail.tanggal_kejadian)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {detail.tanggal_kejadian}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <IconClock size={15} className="text-amber-600" />
                  <span>Durasi Downtime</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatDurationMinutes(detail.durasi_downtime)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <IconUsers size={15} className="text-blue-600" />
                  <span>Pengguna Terdampak</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {Number(detail.jumlah_pengguna_terdampak ?? 0).toLocaleString('id-ID')} Pengguna
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <IconCoin size={15} className="text-emerald-600" />
                  <span>Biaya Pemulihan</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {formatCurrencyIDR(detail.biaya_pemulihan)}
                </div>
              </div>
            </div>

            {/* Sistem Terdampak, Pelapor, Penanggung Jawab */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border border-slate-200 rounded-xl p-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                  <IconServer size={15} className="text-slate-700" />
                  <span>Sistem / Layanan Terdampak</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{detail.sistem_terdampak}</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                  <IconUserExclamation size={15} className="text-slate-700" />
                  <span>Pelapor Insiden</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{detail.pelapor}</p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                  <IconUserCheck size={15} className="text-slate-700" />
                  <span>Tim Penanggung Jawab</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{detail.penanggung_jawab}</p>
              </div>
            </div>

            <Divider />

            {/* Kronologi & Deskripsi Lengkap */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  <IconFileDescription size={16} className="text-red-600" />
                  <span>Deskripsi &amp; Kronologi Gangguan</span>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {detail.deskripsi}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                    <IconZoomQuestion size={16} className="text-amber-700" />
                    <span>Analisis Akar Masalah (Root Cause)</span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                    {detail.akar_masalah || 'Belum ada catatan akar masalah.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1.5">
                    <IconTool size={16} className="text-emerald-700" />
                    <span>Tindakan Perbaikan &amp; Mitigasi</span>
                  </div>
                  <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                    {detail.tindakan_perbaikan || 'Belum ada rincian tindakan perbaikan.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Aksi Modal */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Terakhir diperbarui:{' '}
                {detail.updated_at
                  ? new Date(detail.updated_at).toLocaleString('id-ID')
                  : '-'}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  hierarchy="secondary"
                  size="md"
                  onClick={onClose}
                >
                  Tutup
                </Button>

                <Button
                  type="button"
                  hierarchy="secondary"
                  size="md"
                  prefixIcon={<IconEdit size={16} />}
                  onClick={() => {
                    onClose();
                    onEdit(detail);
                  }}
                >
                  Ubah Data Ini
                </Button>

                <Button
                  type="button"
                  hierarchy="primary"
                  size="md"
                  prefixIcon={<IconTrash size={16} />}
                  onClick={() => {
                    onClose();
                    onDelete(detail);
                  }}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

