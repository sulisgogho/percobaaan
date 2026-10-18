import React from 'react';
import { Button, Badge, Avatar } from '@idds/react';
import {
  IconPlus,
  IconLogout,
  IconShieldCheck,
  IconRefresh,
  IconServerBolt,
} from '@tabler/icons-react';

export default function Navbar({
  user,
  onLogout,
  onOpenCreate,
  onRefresh,
  isRefreshing,
}) {
  const initials = user?.nama_lengkap
    ? user.nama_lengkap
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'TI';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      {/* Pita Identitas Resmi Pemerintahan Digital Indonesia */}
      <div className="bg-red-700 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>INA Digital Design System (IDDS) — Portal Operasional Keandalan Layanan TI</span>
          </div>
          <span className="hidden sm:inline text-red-100">
            Standar Antarmuka Sistem Pemerintahan Berbasis Elektronik (SPBE)
          </span>
        </div>
      </div>

      {/* Navigasi Utama */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo & Judul Aplikasi */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <IconServerBolt size={22} stroke={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  SIGAP-TI
                </span>
                <Badge variant="brand" type="soft" size="sm">
                  IDDS v1.6
                </Badge>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistem Pencatatan &amp; Pemantauan Gangguan Teknologi Informasi
              </p>
            </div>
          </div>

          {/* Aksi Cepat & Informasi Pengguna */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              hierarchy="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              prefixIcon={
                <IconRefresh
                  size={16}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
              }
              aria-label="Muat ulang data gangguan"
              title="Muat ulang daftar data dari server"
            >
              <span className="hidden md:inline">Segarkan</span>
            </Button>

            <Button
              type="button"
              hierarchy="primary"
              size="sm"
              onClick={onOpenCreate}
              prefixIcon={<IconPlus size={16} />}
              aria-label="Tambah catatan gangguan TI baru"
            >
              <span>Catat Gangguan</span>
            </Button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            {/* Profil Pengguna Terautentikasi */}
            <div className="flex items-center gap-2.5 pl-1">
              <Avatar fallbackText={initials} size="sm" />
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <span>{user?.nama_lengkap}</span>
                  <IconShieldCheck size={14} className="text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500">
                  {user?.peran} • {user?.username}
                </div>
              </div>

              <Button
                type="button"
                hierarchy="tertiary"
                size="sm"
                onClick={onLogout}
                prefixIcon={<IconLogout size={16} className="text-red-600" />}
                aria-label="Keluar dari sesi aplikasi"
                title="Keluar (Logout)"
              >
                <span className="hidden sm:inline text-red-600 font-medium">Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

