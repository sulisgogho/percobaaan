import React from 'react';
import { Modal, Button, Alert, Badge, Spinner } from '@idds/react';
import { IconTrash, IconX } from '@tabler/icons-react';
import {
  getStatusBadgeVariant,
  getCategoryBadgeVariant,
  formatDateIndo,
} from '../constants/incidentOptions';

export default function DeleteConfirmModal({
  open,
  incident,
  deleting,
  error,
  onClose,
  onConfirm,
}) {
  if (!incident) return null;

  return (
    <Modal
      open={open}
      onClose={deleting ? () => {} : onClose}
      size="md"
      title="Konfirmasi Penghapusan Catatan Gangguan"
    >
      <div className="space-y-4">
        <Alert
          variant="caution"
          title="Tindakan Tidak Dapat Dibatalkan"
          message="Apakah Anda yakin ingin menghapus catatan gangguan TI berikut secara permanen dari database PostgreSQL?"
        />

        {error && (
          <Alert
            variant="critical"
            title="Gagal Menghapus Data"
            message={error}
          />
        )}

        {/* Ringkasan Data yang Akan Dihapus */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand" type="soft" size="sm">
              {incident.kode_gangguan}
            </Badge>
            <Badge variant={getCategoryBadgeVariant(incident.kategori)} type="soft" size="sm">
              {incident.kategori}
            </Badge>
            <Badge variant={getStatusBadgeVariant(incident.status)} type="fill" size="sm">
              {incident.status}
            </Badge>
          </div>
          <p className="text-sm font-bold text-slate-900">{incident.judul}</p>
          <p className="text-xs text-slate-600">
            Sistem: <strong>{incident.sistem_terdampak}</strong> • Tanggal:{' '}
            <strong>{formatDateIndo(incident.tanggal_kejadian)}</strong>
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-200">
          <Button
            type="button"
            hierarchy="secondary"
            size="md"
            disabled={deleting}
            onClick={onClose}
            prefixIcon={<IconX size={16} />}
          >
            Batal
          </Button>

          <Button
            type="button"
            hierarchy="primary"
            size="md"
            disabled={deleting}
            onClick={() => onConfirm(incident.id)}
            prefixIcon={deleting ? <Spinner size="sm" /> : <IconTrash size={16} />}
          >
            {deleting ? 'Menghapus Data...' : 'Ya, Hapus Permanen'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

