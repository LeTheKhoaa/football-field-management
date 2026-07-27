'use client';

import { FormEvent, useEffect, useState } from 'react';
import api from '@/src/services/axios';

export interface TimeSlotFormData {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface TimeSlotFormProps {
  initialData?: TimeSlotFormData | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function TimeSlotForm({
  initialData,
  onSaved,
  onCancel,
}: TimeSlotFormProps) {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!initialData) {
      setName('');
      setStartTime('');
      setEndTime('');
      return;
    }

    setName(initialData.name);
    setStartTime(initialData.startTime.slice(0, 5));
    setEndTime(initialData.endTime.slice(0, 5));
  }, [initialData]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage('');

      const payload = {
        name: name.trim(),
        startTime,
        endTime,
      };

      if (initialData) {
        await api.patch(
          `/time-slots/${initialData.id}`,
          payload,
        );
      } else {
        await api.post('/time-slots', payload);
      }

      onSaved();
    } catch (error) {
      console.error(error);

      setErrorMessage(
        'Không thể lưu khung giờ. Hãy kiểm tra dữ liệu.',
      );
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
          ? 'Cập nhật khung giờ'
          : 'Thêm khung giờ'}
      </h2>

      {errorMessage && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Tên khung giờ
          </label>

          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Giờ bắt đầu
          </label>

          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Giờ kết thúc
          </label>

          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-slate-300 px-4 py-2"
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-white"
        >
          {saving
            ? 'Đang lưu...'
            : initialData
            ? 'Lưu thay đổi'
            : 'Lưu khung giờ'}
        </button>
      </div>
    </form>
  );
}