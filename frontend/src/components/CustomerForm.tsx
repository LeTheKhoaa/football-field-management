'use client';

import { FormEvent, useEffect, useState } from 'react';
import api from '@/src/services/axios';

export interface CustomerFormData {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}

interface CustomerFormProps {
  initialData?: CustomerFormData | null;
  onSaved: () => void;
  onCancel: () => void;
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Không thể lưu khách hàng. Hãy kiểm tra lại dữ liệu.';
}

export default function CustomerForm({
  initialData,
  onSaved,
  onCancel,
}: CustomerFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName ?? '');
      setPhone(initialData.phone ?? '');
      setEmail(initialData.email ?? '');
      setAddress(initialData.address ?? '');
      return;
    }

    setFullName('');
    setPhone('');
    setEmail('');
    setAddress('');
  }, [initialData]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedFullName = fullName.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim();
    const normalizedAddress = address.trim();

    if (!normalizedFullName) {
      setErrorMessage('Họ và tên không được để trống.');
      return;
    }

    if (!normalizedPhone) {
      setErrorMessage('Số điện thoại không được để trống.');
      return;
    }

    const phonePattern = /^[0-9+\s.-]{8,20}$/;

    if (!phonePattern.test(normalizedPhone)) {
      setErrorMessage('Số điện thoại không hợp lệ.');
      return;
    }

    if (normalizedEmail) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(normalizedEmail)) {
        setErrorMessage('Email không hợp lệ.');
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const payload = {
        fullName: normalizedFullName,
        phone: normalizedPhone,
        email: normalizedEmail || undefined,
        address: normalizedAddress || undefined,
      };

      if (initialData) {
        await api.patch(
          `/customers/${initialData.id}`,
          payload,
        );
      } else {
        await api.post('/customers', payload);
      }

      onSaved();
    } catch (error) {
      console.error('Không thể lưu khách hàng:', error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-white p-6 shadow"
    >
      <h2 className="mb-5 text-xl font-bold text-slate-800">
        {initialData
          ? 'Cập nhật khách hàng'
          : 'Thêm khách hàng'}
      </h2>

      {errorMessage && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Họ và tên
          </label>

          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Ví dụ: Nguyễn Văn An"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Số điện thoại
          </label>

          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="Ví dụ: 0912345678"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Ví dụ: nguyenvanan@gmail.com"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Địa chỉ
          </label>

          <input
            id="address"
            type="text"
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            placeholder="Nhập địa chỉ khách hàng"
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md bg-slate-300 px-4 py-2 text-slate-800 transition hover:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? 'Đang lưu...'
            : initialData
              ? 'Lưu thay đổi'
              : 'Lưu khách hàng'}
        </button>
      </div>
    </form>
  );
}