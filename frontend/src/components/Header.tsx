'use client';

import { FaBell, FaUserCircle } from 'react-icons/fa';

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Hệ thống quản lý sân bóng
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Thông báo"
        >
          <FaBell className="text-lg" />
        </button>

        <div className="flex items-center gap-2">
          <FaUserCircle className="text-2xl text-slate-500" />

          <div className="text-sm">
            <p className="font-medium text-slate-700">
              Quản trị viên
            </p>
            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}