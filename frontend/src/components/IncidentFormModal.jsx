import React, { useEffect, useState } from 'react';
import {
  Modal,
  TextField,
  TextArea,
  SelectDropdown,
  Button,
  Alert,
  Badge,
  Spinner,
} from '@idds/react';
import {
  IconDeviceFloppy,
  IconX,
  IconSparkles,
  IconBug,
} from '@tabler/icons-react';
import {
  KATEGORI_OPTIONS,
  STATUS_OPTIONS,
  PRIORITAS_OPTIONS,
} from '../constants/incidentOptions';

const INITIAL_FORM = {
  kode_gangguan: '',
  judul: '',
  deskripsi: '',
  kategori: 'Jaringan',
  status: 'Terbuka',
  prioritas: 'Sedang',
  tanggal_kejadian: new Date().toISOString().split('T')[0],
  durasi_downtime: '0',
  jumlah_pengguna_terdampak: '0',
  biaya_pemulihan: '0',
  sistem_terdampak: '',
  pelapor: '',
  penanggung_jawab: 'Tim Tanggap Insiden TI',
  akar_masalah: '',
  tindakan_perbaikan: '',
};

export default function IncidentFormModal({
  open,
  mode, // 'create' | 'edit'
  initialData,
  suggestedCode,
  defaultReporter,
  submitting,
  serverError,
  fieldErrors = {},
  onClearFieldError,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initialData) {
      setForm({
        kode_gangguan: initialData.kode_gangguan || '',
        judul: initialData.judul || '',
        deskripsi: initialData.deskripsi || '',
        kategori: initialData.kategori || 'Jaringan',
        status: initialData.status || 'Terbuka',
        prioritas: initialData.prioritas || 'Sedang',
        tanggal_kejadian: initialData.tanggal_kejadian || new Date().toISOString().split('T')[0],
        durasi_downtime: String(initialData.durasi_downtime ?? 0),
        jumlah_pengguna_terdampak: String(initialData.jumlah_pengguna_terdampak ?? 0),
        biaya_pemulihan: String(initialData.biaya_pemulihan ?? 0),
        sistem_terdampak: initialData.sistem_terdampak || '',
        pelapor: initialData.pelapor || '',
        penanggung_jawab: initialData.penanggung_jawab || 'Tim Tanggap Insiden TI',
        akar_masalah: initialData.akar_masalah || '',
        tindakan_perbaikan: initialData.tindakan_perbaikan || '',
      });
    } else {
      setForm({
        ...INITIAL_FORM,
        kode_gangguan: suggestedCode || 'INC-2026-021',
        pelapor: defaultReporter || '',
        tanggal_kejadian: new Date().toISOString().split('T')[0],
      });
    }
  }, [open, mode, initialData, suggestedCode, defaultReporter]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field] && onClearFieldError) {
      onClearFieldError(field);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  // Fungsi bantu untuk menguji respons validasi backend secara langsung dari formulir
  const handleFillInvalidForTest = () => {
    setForm({
      kode_gangguan: 'INC-2026-001', // Duplikat dengan data contoh #1
      judul: '', // Kosong (wajib diisi)
      deskripsi: 'Singkat', // Kurang dari 10 karakter
      kategori: 'Kategori Tidak Valid', // Di luar pilihan
      status: 'Status Tidak Valid', // Di luar pilihan
      prioritas: 'Sedang',
      tanggal_kejadian: '2026-02-30', // Tanggal kalender tidak valid
      durasi_downtime: '-25', // Negatif (harus >= 0)
      jumlah_pengguna_terdampak: '-10', // Negatif (harus >= 0)
      biaya_pemulihan: '-50000', // Negatif (harus >= 0)
      sistem_terdampak: '', // Kosong (wajib diisi)
      pelapor: '', // Kosong (wajib diisi)
      penanggung_jawab: 'Tim Tanggap Insiden TI',
      akar_masalah: '',
      tindakan_perbaikan: '',
    });
  };

  const errorEntries = Object.entries(fieldErrors).filter(([, msg]) => Boolean(msg));

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      size="xl"
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-900">
            {mode === 'edit'
              ? `Ubah Catatan Gangguan TI (${initialData?.kode_gangguan || ''})`
              : 'Tambah Catatan Gangguan TI Baru'}
          </span>
          <Badge variant={mode === 'edit' ? 'warning' : 'brand'} type="soft" size="sm">
            {mode === 'edit' ? 'Mode Ubah' : 'Mode Tambah'}
          </Badge>
        </div>
      }
    >
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="space-y-5 max-h-[76vh] overflow-y-auto pr-1"
      >
        {/* Bilah Alat Pengujian Cepat Validasi Backend */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-600">
            Kolom bertanda <strong className="text-red-600">*</strong> wajib diisi. Seluruh isian
            diperiksa oleh validator backend PostgreSQL.
          </span>
          <Button
            type="button"
            hierarchy="tertiary"
            size="sm"
            onClick={handleFillInvalidForTest}
            prefixIcon={<IconBug size={15} className="text-amber-600" />}
            title="Isi contoh data tidak valid untuk menguji pesan kesalahan dari backend"
          >
            <span className="text-amber-700 font-medium">Simulasi Uji Validasi Backend</span>
          </Button>
        </div>

        {/* Ringkasan Pesan Kesalahan dari Backend */}
        {(serverError || errorEntries.length > 0) && (
          <div role="alert" aria-live="assertive" className="space-y-2">
            <Alert
              variant="critical"
              title={serverError || 'Terdapat kesalahan validasi pada isian formulir'}
              message={
                errorEntries.length > 0 ? (
                  <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                    {errorEntries.map(([key, msg]) => (
                      <li key={key}>{msg}</li>
                    ))}
                  </ul>
                ) : (
                  'Mohon periksa kembali isian Anda.'
                )
              }
            />
          </div>
        )}

        {/* Baris 1: Kode Unik & Tanggal Kejadian */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  id="field-kode-gangguan"
                  name="kode_gangguan"
                  label="Kode Gangguan (Unik) *"
                  placeholder="Contoh: INC-2026-021"
                  value={form.kode_gangguan}
                  onChange={(val) => updateField('kode_gangguan', val.toUpperCase())}
                  status={fieldErrors.kode_gangguan ? 'error' : 'neutral'}
                  statusMessage={fieldErrors.kode_gangguan}
                  helperText="Harus unik di database (huruf kapital, angka, tanda hubung)."
                  disabled={submitting}
                  showClearButton
                />
              </div>
              {mode === 'create' && suggestedCode && (
                <div className="pb-6">
                  <Button
                    type="button"
                    hierarchy="secondary"
                    size="md"
                    onClick={() => updateField('kode_gangguan', suggestedCode)}
                    prefixIcon={<IconSparkles size={15} />}
                    title="Gunakan saran kode unik otomatis"
                  >
                    Kode Otomatis
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-6">
            <TextField
              id="field-tanggal-kejadian"
              name="tanggal_kejadian"
              type="date"
              label="Tanggal Kejadian (YYYY-MM-DD) *"
              placeholder="YYYY-MM-DD"
              value={form.tanggal_kejadian}
              onChange={(val) => updateField('tanggal_kejadian', val)}
              status={fieldErrors.tanggal_kejadian ? 'error' : 'neutral'}
              statusMessage={fieldErrors.tanggal_kejadian}
              helperText="Format tanggal kalender yang valid (contoh: 2026-10-18)."
              disabled={submitting}
              showClearButton={false}
            />
          </div>
        </div>

        {/* Baris 2: Judul Gangguan */}
        <div>
          <TextField
            id="field-judul"
            name="judul"
            label="Judul Gangguan TI *"
            placeholder="Contoh: Gangguan Koneksi VPN Kantor Perwakilan Wilayah Tengah"
            value={form.judul}
            onChange={(val) => updateField('judul', val)}
            status={fieldErrors.judul ? 'error' : 'neutral'}
            statusMessage={fieldErrors.judul}
            helperText="Ringkasan jelas mengenai insiden yang terjadi (minimal 5 karakter)."
            maxLength={200}
            showCharCount
            disabled={submitting}
            showClearButton
          />
        </div>

        {/* Baris 3: Kategori, Status, dan Prioritas menggunakan IDDS SelectDropdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SelectDropdown
              label="Kategori Gangguan"
              required
              options={KATEGORI_OPTIONS}
              selected={form.kategori}
              onSelect={(val) => updateField('kategori', val)}
              placeholder="Pilih Kategori"
              error={Boolean(fieldErrors.kategori)}
              searchable={false}
              showPreviewValue={false}
              width="100%"
              disabled={submitting}
            />
            {fieldErrors.kategori ? (
              <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                {fieldErrors.kategori}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Pilih salah satu dari 6 kategori standar.
              </p>
            )}
          </div>

          <div>
            <SelectDropdown
              label="Status Penanganan"
              required
              options={STATUS_OPTIONS}
              selected={form.status}
              onSelect={(val) => updateField('status', val)}
              placeholder="Pilih Status"
              error={Boolean(fieldErrors.status)}
              searchable={false}
              showPreviewValue={false}
              width="100%"
              disabled={submitting}
            />
            {fieldErrors.status ? (
              <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                {fieldErrors.status}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Status terkini penyelesaian gangguan.
              </p>
            )}
          </div>

          <div>
            <SelectDropdown
              label="Tingkat Prioritas"
              required
              options={PRIORITAS_OPTIONS}
              selected={form.prioritas}
              onSelect={(val) => updateField('prioritas', val)}
              placeholder="Pilih Prioritas"
              error={Boolean(fieldErrors.prioritas)}
              searchable={false}
              showPreviewValue={false}
              width="100%"
              disabled={submitting}
            />
            {fieldErrors.prioritas ? (
              <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                {fieldErrors.prioritas}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Tingkat urgensi penanganan SLA.
              </p>
            )}
          </div>
        </div>

        {/* Baris 4: Nilai Angka Nol atau Lebih (Downtime, Pengguna Terdampak, Biaya Pemulihan) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <TextField
              id="field-durasi-downtime"
              name="durasi_downtime"
              type="number"
              label="Durasi Downtime (Menit) *"
              placeholder="0"
              value={form.durasi_downtime}
              onChange={(val) => updateField('durasi_downtime', val)}
              status={fieldErrors.durasi_downtime ? 'error' : 'neutral'}
              statusMessage={fieldErrors.durasi_downtime}
              helperText="Wajib angka bulat 0 atau lebih."
              disabled={submitting}
              showClearButton={false}
            />
          </div>

          <div>
            <TextField
              id="field-jumlah-pengguna"
              name="jumlah_pengguna_terdampak"
              type="number"
              label="Jumlah Pengguna Terdampak *"
              placeholder="0"
              value={form.jumlah_pengguna_terdampak}
              onChange={(val) => updateField('jumlah_pengguna_terdampak', val)}
              status={fieldErrors.jumlah_pengguna_terdampak ? 'error' : 'neutral'}
              statusMessage={fieldErrors.jumlah_pengguna_terdampak}
              helperText="Wajib angka bulat 0 atau lebih."
              disabled={submitting}
              showClearButton={false}
            />
          </div>

          <div>
            <TextField
              id="field-biaya-pemulihan"
              name="biaya_pemulihan"
              type="number"
              label="Estimasi Biaya Pemulihan (Rp) *"
              placeholder="0"
              value={form.biaya_pemulihan}
              onChange={(val) => updateField('biaya_pemulihan', val)}
              status={fieldErrors.biaya_pemulihan ? 'error' : 'neutral'}
              statusMessage={fieldErrors.biaya_pemulihan}
              helperText="Wajib nilai angka 0 atau lebih."
              disabled={submitting}
              showClearButton={false}
            />
          </div>
        </div>

        {/* Baris 5: Sistem Terdampak, Pelapor, Penanggung Jawab */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <TextField
              id="field-sistem-terdampak"
              name="sistem_terdampak"
              label="Sistem / Layanan Terdampak *"
              placeholder="Contoh: Klaster Database SSO"
              value={form.sistem_terdampak}
              onChange={(val) => updateField('sistem_terdampak', val)}
              status={fieldErrors.sistem_terdampak ? 'error' : 'neutral'}
              statusMessage={fieldErrors.sistem_terdampak}
              helperText="Nama aset, server, atau aplikasi."
              disabled={submitting}
              showClearButton
            />
          </div>

          <div>
            <TextField
              id="field-pelapor"
              name="pelapor"
              label="Nama / Unit Pelapor *"
              placeholder="Contoh: Budi Santoso (NOC)"
              value={form.pelapor}
              onChange={(val) => updateField('pelapor', val)}
              status={fieldErrors.pelapor ? 'error' : 'neutral'}
              statusMessage={fieldErrors.pelapor}
              helperText="Petugas atau sistem yang melaporkan."
              disabled={submitting}
              showClearButton
            />
          </div>

          <div>
            <TextField
              id="field-penanggung-jawab"
              name="penanggung_jawab"
              label="Tim Penanggung Jawab *"
              placeholder="Contoh: Tim Jaringan & Infrastruktur"
              value={form.penanggung_jawab}
              onChange={(val) => updateField('penanggung_jawab', val)}
              status={fieldErrors.penanggung_jawab ? 'error' : 'neutral'}
              statusMessage={fieldErrors.penanggung_jawab}
              helperText="Unit teknis yang menangani insiden."
              disabled={submitting}
              showClearButton
            />
          </div>
        </div>

        {/* Baris 6: Deskripsi Lengkap */}
        <div>
          <TextArea
            id="field-deskripsi"
            name="deskripsi"
            label="Deskripsi & Kronologi Gangguan *"
            placeholder="Jelaskan gejala gangguan, cakupan dampak, serta waktu terjadinya secara rinci (minimal 10 karakter)..."
            value={form.deskripsi}
            onChange={(val) => updateField('deskripsi', val)}
            status={fieldErrors.deskripsi ? 'error' : 'neutral'}
            statusMessage={fieldErrors.deskripsi}
            helperText="Wajib diisi minimal 10 karakter."
            minRows={3}
            maxRows={6}
            disabled={submitting}
          />
        </div>

        {/* Baris 7: Akar Masalah & Tindakan Perbaikan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <TextArea
              id="field-akar-masalah"
              name="akar_masalah"
              label="Analisis Akar Masalah (Root Cause)"
              placeholder="Penyebab teknis terjadinya gangguan (opsional)..."
              value={form.akar_masalah}
              onChange={(val) => updateField('akar_masalah', val)}
              helperText="Isi jika penyebab utama sudah teridentifikasi."
              minRows={2}
              maxRows={5}
              disabled={submitting}
            />
          </div>

          <div>
            <TextArea
              id="field-tindakan-perbaikan"
              name="tindakan_perbaikan"
              label="Tindakan Perbaikan & Mitigasi"
              placeholder="Langkah pemulihan yang telah atau sedang dilakukan (opsional)..."
              value={form.tindakan_perbaikan}
              onChange={(val) => updateField('tindakan_perbaikan', val)}
              helperText="Langkah penanganan teknis oleh tim."
              minRows={2}
              maxRows={5}
              disabled={submitting}
            />
          </div>
        </div>

        {/* Tombol Aksi Formulir (Dapat diakses penuh dengan Keyboard Tab/Enter/Space) */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            hierarchy="secondary"
            size="md"
            disabled={submitting}
            onClick={onClose}
            prefixIcon={<IconX size={16} />}
          >
            Batal
          </Button>

          <Button
            type="submit"
            hierarchy="primary"
            size="md"
            disabled={submitting}
            prefixIcon={
              submitting ? <Spinner size="sm" /> : <IconDeviceFloppy size={16} />
            }
          >
            {submitting
              ? 'Menyimpan ke Database...'
              : mode === 'edit'
              ? 'Simpan Perubahan Data'
              : 'Simpan Catatan Gangguan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

