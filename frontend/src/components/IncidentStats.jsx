import React from 'react';
import { Badge, Skeleton } from '@idds/react';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClockHour4,
  IconFlame,
  IconListDetails,
  IconUsersGroup,
} from '@tabler/icons-react';

export default function IncidentStats({ summary, loading }) {
  const stats = [
    {
      id: 'total_semua',
      label: 'Total Catatan Gangguan',
      value: summary?.total_semua ?? 0,
      unit: 'Insiden',
      badge: 'Basis Data',
      badgeVariant: 'brand',
      icon: <IconListDetails size={20} className="text-red-600" />,
      bgIcon: 'bg-red-50 border-red-100',
    },
    {
      id: 'total_aktif',
      label: 'Dalam Penanganan / Terbuka',
      value: summary?.total_aktif ?? 0,
      unit: 'Insiden Aktif',
      badge: 'Perlu Tindakan',
      badgeVariant: 'warning',
      icon: <IconAlertTriangle size={20} className="text-amber-600" />,
      bgIcon: 'bg-amber-50 border-amber-100',
    },
    {
      id: 'total_selesai',
      label: 'Selesai & Ditutup',
      value: summary?.total_selesai ?? 0,
      unit: 'Teratasi',
      badge: 'Pulih',
      badgeVariant: 'success',
      icon: <IconCircleCheck size={20} className="text-emerald-600" />,
      bgIcon: 'bg-emerald-50 border-emerald-100',
    },
    {
      id: 'total_kritis',
      label: 'Prioritas Kritis',
      value: summary?.total_kritis ?? 0,
      unit: 'Insiden',
      badge: 'SLA Utama',
      badgeVariant: 'error',
      icon: <IconFlame size={20} className="text-rose-600" />,
      bgIcon: 'bg-rose-50 border-rose-100',
    },
    {
      id: 'total_downtime',
      label: 'Akumulasi Downtime',
      value: (summary?.total_downtime ?? 0).toLocaleString('id-ID'),
      unit: 'Menit',
      badge: 'Ketersediaan',
      badgeVariant: 'info',
      icon: <IconClockHour4 size={20} className="text-blue-600" />,
      bgIcon: 'bg-blue-50 border-blue-100',
    },
    {
      id: 'total_pengguna_terdampak',
      label: 'Total Pengguna Terdampak',
      value: (summary?.total_pengguna_terdampak ?? 0).toLocaleString('id-ID'),
      unit: 'Pengguna',
      badge: 'Cakupan Dampak',
      badgeVariant: 'neutral',
      icon: <IconUsersGroup size={20} className="text-slate-700" />,
      bgIcon: 'bg-slate-100 border-slate-200',
    },
  ];

  return (
    <section aria-label="Ringkasan Statistik Gangguan TI" className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {stats.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${item.bgIcon}`}
              >
                {item.icon}
              </div>
              <Badge variant={item.badgeVariant} type="soft" size="sm">
                {item.badge}
              </Badge>
            </div>

            <div>
              {loading ? (
                <div className="space-y-1.5">
                  <Skeleton height={28} width="60%" />
                  <Skeleton height={14} width="85%" />
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                      {item.value}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{item.unit}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{item.label}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

