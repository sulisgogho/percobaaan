import React, { useState } from 'react';
import {
  Button,
  TextField,
  PasswordInput,
  Alert,
  Badge,
  Spinner,
   useToast,
} from '@idds/react';
import {
  IconServerBolt,
  IconLogin,
  IconUserPlus,
  IconKey,
  IconShieldLock,
  IconCheck,
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // State formulir login
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // State formulir registrasi
  const [registerForm, setRegisterForm] = useState({
    nama_lengkap: '',
    username: '',
    email: '',
    unit_kerja: 'Pusat Data & Operasional TI',
    peran: 'Teknisi Respon Insiden',
    password: '',
  });

  const handleQuickFill = (username, password) => {
    setMode('login');
    setGeneralError('');
    setFieldErrors({});
    setLoginForm({ username, password });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await login(loginForm);
      toast({
        state: 'positive',
        style: 'solid',
        title: 'Autentikasi Berhasil',
        description: res.message || 'Selamat datang di Sistem Catatan Gangguan TI.',
        position: 'top-right',
        duration: 4000,
      });
    } catch (err) {
      setGeneralError(err.message || 'Gagal masuk. Periksa kembali kredensial Anda.');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      toast({
        state: 'destructive',
        style: 'solid',
        title: 'Gagal Masuk',
        description: err.message || 'Nama pengguna atau kata sandi tidak sesuai.',
        position: 'top-right',
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await register(registerForm);
      toast({
        state: 'positive',
        style: 'solid',
        title: 'Pendaftaran Berhasil',
        description: res.message || 'Akun baru berhasil dibuat.',
        position: 'top-right',
        duration: 4000,
      });
    } catch (err) {
      setGeneralError(err.message || 'Pendaftaran gagal. Periksa kembali formulir Anda.');
      if (err.errors) {
        setFieldErrors(err.errors);
      }
      toast({
        state: 'destructive',
        style: 'solid',
        title: 'Gagal Mendaftar',
        description: err.message || 'Terdapat kesalahan pada isian pendaftaran.',
        position: 'top-right',
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Pita Identitas Atas */}
      <div className="bg-red-700 text-white text-xs py-2 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">
            INA Digital Design System (IDDS) — Portal Manajemen Insiden &amp; Gangguan TI
          </span>
          <span className="text-red-100">Terintegrasi PostgreSQL &amp; Autentikasi JWT</span>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Kolom Kiri: Informasi Sistem & Kredensial Demo */}
          <div className="lg:col-span-5 bg-gradient-to-br from-red-700 via-red-800 to-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/25">
                  <IconServerBolt size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">SIGAP-TI</h1>
                  <p className="text-xs text-red-100">INA Digital Design System</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold leading-snug mb-3">
                Sistem Pencatatan &amp; Pemantauan Gangguan Layanan TI
              </h2>
              <p className="text-sm text-red-100/90 leading-relaxed mb-6">
                Kelola insiden infrastruktur, jaringan, aplikasi, basis data, dan keamanan siber
                secara terpusat, transparan, dan terukur sesuai standar layanan digital nasional.
              </p>

              <ul className="space-y-2.5 text-xs text-red-50 mb-8">
                <li className="flex items-center gap-2">
                  <IconCheck size={16} className="text-emerald-300 shrink-0" />
                  <span>20 Data Contoh Insiden TI Siap Pakai di PostgreSQL</span>
                </li>
                <li className="flex items-center gap-2">
                  <IconCheck size={16} className="text-emerald-300 shrink-0" />
                  <span>Operasi CRUD Lengkap dengan Konfirmasi Penghapusan</span>
                </li>
                <li className="flex items-center gap-2">
                  <IconCheck size={16} className="text-emerald-300 shrink-0" />
                  <span>Validasi Backend Ketat (Kode Unik, Tanggal, Angka ≥ 0, Pilihan)</span>
                </li>
                <li className="flex items-center gap-2">
                  <IconCheck size={16} className="text-emerald-300 shrink-0" />
                  <span>Komponen Resmi @idds/react &amp; Responsif Semua Perangkat</span>
                </li>
              </ul>
            </div>

            {/* Kotak Akun Demo Cepat */}
            <div className="bg-black/25 border border-white/15 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-200 mb-2.5">
                <IconKey size={15} />
                <span>Akun Demo Siap Pakai (Klik untuk Isi Otomatis)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin', 'Admin123!')}
                  className="text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition border border-white/15 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Admin Utama TI</span>
                    <span className="text-[11px] bg-red-500/40 px-2 py-0.5 rounded text-white">
                      Isi Cepat
                    </span>
                  </div>
                  <div className="text-xs text-red-100 mt-1 font-mono">
                    User: <strong>admin</strong> | Sandi: <strong>Admin123!</strong>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('teknisi', 'Teknisi123!')}
                  className="text-left p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition border border-white/15 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Teknisi NOC</span>
                    <span className="text-[11px] bg-red-500/40 px-2 py-0.5 rounded text-white">
                      Isi Cepat
                    </span>
                  </div>
                  <div className="text-xs text-red-100 mt-1 font-mono">
                    User: <strong>teknisi</strong> | Sandi: <strong>Teknisi123!</strong>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Formulir Login / Registrasi */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-2 mb-6">
              <div>
                <Badge variant="brand" type="soft" size="md">
                  Autentikasi Pengguna
                </Badge>
                <h2 className="text-2xl font-bold text-slate-900 mt-2">
                  {mode === 'login' ? 'Masuk ke Portal SIGAP-TI' : 'Daftar Akun Petugas Baru'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  {mode === 'login'
                    ? 'Masukkan kredensial akun Anda atau gunakan tombol Akun Demo di samping.'
                    : 'Lengkapi data petugas TI di bawah ini untuk membuat akun baru.'}
                </p>
              </div>
            </div>

            {/* Tab Pilihan Masuk / Daftar */}
            <div
              role="tablist"
              aria-label="Mode Autentikasi"
              className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => {
                  setMode('login');
                  setGeneralError('');
                  setFieldErrors({});
                }}
                className={`py-2 px-4 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <IconLogin size={17} />
                <span>Masuk (Login)</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => {
                  setMode('register');
                  setGeneralError('');
                  setFieldErrors({});
                }}
                className={`py-2 px-4 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-red-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <IconUserPlus size={17} />
                <span>Daftar Akun</span>
              </button>
            </div>

            {/* Umpan Balik Pesan Kesalahan Autentikasi */}
            {generalError && (
              <div className="mb-5" role="alert">
                <Alert
                  variant="critical"
                  title="Autentikasi Gagal"
                  message={generalError}
                  dismissible
                  onDismiss={() => setGeneralError('')}
                />
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
                <div>
                  <TextField
                    id="login-username"
                    name="username"
                    label="Nama Pengguna (Username) atau Email *"
                    placeholder="Contoh: admin atau admin@inadigital.go.id"
                    value={loginForm.username}
                    onChange={(val) => {
                      setLoginForm((prev) => ({ ...prev, username: val }));
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: undefined }));
                      }
                    }}
                    status={fieldErrors.username ? 'error' : 'neutral'}
                    statusMessage={fieldErrors.username}
                    helperText="Ketik 'admin' atau 'teknisi' untuk akun contoh."
                    disabled={submitting}
                    showClearButton
                  />
                </div>

                <div>
                  <PasswordInput
                    id="login-password"
                    name="password"
                    label="Kata Sandi (Password) *"
                    placeholder="Masukkan kata sandi Anda"
                    value={loginForm.password}
                    onChange={(val) => {
                      setLoginForm((prev) => ({ ...prev, password: val }));
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    status={fieldErrors.password ? 'error' : 'neutral'}
                    statusMessage={fieldErrors.password}
                    helperText="Kata sandi akun admin: Admin123!"
                    disabled={submitting}
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <Button
                    type="submit"
                    hierarchy="primary"
                    size="lg"
                    disabled={submitting}
                    prefixIcon={
                      submitting ? <Spinner size="sm" /> : <IconShieldLock size={18} />
                    }
                    className="w-full sm:w-auto justify-center"
                  >
                    {submitting ? 'Memverifikasi Kredensial...' : 'Masuk ke Sistem'}
                  </Button>

                  <Button
                    type="button"
                    hierarchy="secondary"
                    size="md"
                    disabled={submitting}
                    onClick={() => handleQuickFill('admin', 'Admin123!')}
                  >
                    Isi Akun Demo Admin
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    id="reg-nama"
                    name="nama_lengkap"
                    label="Nama Lengkap Petugas *"
                    placeholder="Contoh: Andi Wijaya, S.Kom."
                    value={registerForm.nama_lengkap}
                    onChange={(val) =>
                      setRegisterForm((prev) => ({ ...prev, nama_lengkap: val }))
                    }
                    status={fieldErrors.nama_lengkap ? 'error' : 'neutral'}
                    statusMessage={fieldErrors.nama_lengkap}
                    disabled={submitting}
                  />

                  <TextField
                    id="reg-username"
                    name="username"
                    label="Username *"
                    placeholder="Contoh: andi_noc"
                    value={registerForm.username}
                    onChange={(val) =>
                      setRegisterForm((prev) => ({ ...prev, username: val }))
                    }
                    status={fieldErrors.username ? 'error' : 'neutral'}
                    statusMessage={fieldErrors.username}
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    id="reg-email"
                    name="email"
                    label="Email Kedinasan *"
                    placeholder="Contoh: andi@inadigital.go.id"
                    value={registerForm.email}
                    onChange={(val) =>
                      setRegisterForm((prev) => ({ ...prev, email: val }))
                    }
                    status={fieldErrors.email ? 'error' : 'neutral'}
                    statusMessage={fieldErrors.email}
                    disabled={submitting}
                  />

                  <TextField
                    id="reg-unit"
                    name="unit_kerja"
                    label="Unit Kerja"
                    placeholder="Contoh: Direktorat Infrastruktur TI"
                    value={registerForm.unit_kerja}
                    onChange={(val) =>
                      setRegisterForm((prev) => ({ ...prev, unit_kerja: val }))
                    }
                    disabled={submitting}
                  />
                </div>

                <PasswordInput
                  id="reg-password"
                  name="password"
                  label="Kata Sandi Baru (Minimal 6 Karakter) *"
                  placeholder="Buat kata sandi yang kuat"
                  value={registerForm.password}
                  onChange={(val) =>
                    setRegisterForm((prev) => ({ ...prev, password: val }))
                  }
                  status={fieldErrors.password ? 'error' : 'neutral'}
                  statusMessage={fieldErrors.password}
                  disabled={submitting}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    hierarchy="primary"
                    size="lg"
                    disabled={submitting}
                    prefixIcon={
                      submitting ? <Spinner size="sm" /> : <IconUserPlus size={18} />
                    }
                    className="w-full sm:w-auto justify-center"
                  >
                    {submitting ? 'Mendaftarkan Akun...' : 'Daftarkan & Masuk'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

