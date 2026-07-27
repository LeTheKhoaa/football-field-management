'use client';

import Link from 'next/link';
import {
  FaCalendarCheck,
  FaChartLine,
  FaClock,
  FaCreditCard,
  FaFutbol,
  FaMoneyBillWave,
  FaUsers,
} from 'react-icons/fa';

const menuItems = [
  {
    name: 'Tổng quan',
    href: '/dashboard',
    icon: FaChartLine,
  },
  {
    name: 'Quản lý sân',
    href: '/fields',
    icon: FaFutbol,
  },
  {
    name: 'Khung giờ',
    href: '/time-slots',
    icon: FaClock,
  },
  {
    name: 'Bảng giá',
    href: '/field-prices',
    icon: FaMoneyBillWave,
  },
  {
    name: 'Khách hàng',
    href: '/customers',
    icon: FaUsers,
  },
  {
    name: 'Đặt sân',
    href: '/bookings',
    icon: FaCalendarCheck,
  },
  {
    name: 'Thanh toán',
    href: '/payments',
    icon: FaCreditCard,
  },
];

export default function Sidebar() {
  return (
    <aside className="min-h-screen w-64 bg-slate-900 text-white">
      <div className="border-b border-slate-700 px-6 py-5">
        <h1 className="text-xl font-bold">Football Manager</h1>
        <p className="mt-1 text-sm text-slate-400">
          Quản lý sân bóng
        </p>
      </div>

      <nav className="space-y-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon className="text-lg" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}