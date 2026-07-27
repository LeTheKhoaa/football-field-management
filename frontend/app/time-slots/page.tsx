'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/src/components/AdminLayout';
import TimeSlotForm, {
  TimeSlotFormData,
} from '@/src/components/TimeSlotForm';
import api from '@/src/services/axios';

interface TimeSlot extends TimeSlotFormData {
  isActive?: boolean;
}

function formatTime(value: string) {
  if (!value) {
    return '—';
  }

  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  const editingTimeSlot =
    timeSlots.find((timeSlot) => timeSlot.id === editingId) ??
    null;

  const loadTimeSlots = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await api.get<TimeSlot[]>('/time-slots');

      setTimeSlots(response.data);
    } catch (error) {
      console.error('Không thể tải danh sách khung giờ:', error);

      setErrorMessage(
        'Không thể tải danh sách khung giờ. Hãy kiểm tra Backend.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTimeSlots();
  }, [loadTimeSlots]);

  function handleOpenCreateForm() {
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(id: number) {
    setEditingId(id);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function handleSaved() {
    handleCloseForm();
    void loadTimeSlots();
  }

  async function handleDelete(timeSlot: TimeSlot) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa khung giờ "${timeSlot.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(timeSlot.id);

      await api.delete(`/time-slots/${timeSlot.id}`);

      if (editingId === timeSlot.id) {
        handleCloseForm();
      }

      await loadTimeSlots();

      window.alert('Xóa khung giờ thành công.');
    } catch (error) {
      console.error('Không thể xóa khung giờ:', error);

      window.alert(
        'Không thể xóa khung giờ. Khung giờ này có thể đang được sử dụng trong bảng giá hoặc đơn đặt sân.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Quản lý khung giờ
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý các khoảng thời gian cho thuê sân.
          </p>
        </div>

        <button
          type="button"
          onClick={
            showForm ? handleCloseForm : handleOpenCreateForm
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          {showForm ? 'Đóng form' : '+ Thêm khung giờ'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <TimeSlotForm
            key={editingTimeSlot?.id ?? 'create'}
            initialData={editingTimeSlot}
            onSaved={handleSaved}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-6 text-slate-600">
            Đang tải danh sách khung giờ...
          </p>
        ) : errorMessage ? (
          <div className="p-6">
            <p className="mb-4 text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadTimeSlots()}
              className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Tải lại
            </button>
          </div>
        ) : timeSlots.length === 0 ? (
          <p className="p-6 text-slate-600">
            Chưa có khung giờ nào trong hệ thống.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-slate-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    ID
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Tên khung giờ
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Giờ bắt đầu
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Giờ kết thúc
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {timeSlots.map((timeSlot) => {
                  const isDeleting =
                    deletingId === timeSlot.id;

                  return (
                    <tr
                      key={timeSlot.id}
                      className="border-b transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="p-4 text-sm text-slate-600">
                        {timeSlot.id}
                      </td>

                      <td className="p-4 font-medium text-slate-800">
                        {timeSlot.name}
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {formatTime(timeSlot.startTime)}
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {formatTime(timeSlot.endTime)}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(timeSlot.id)
                          }
                          disabled={isDeleting}
                          className="mr-2 rounded-md bg-amber-500 px-3 py-1.5 text-sm text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(timeSlot)
                          }
                          disabled={isDeleting}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting
                            ? 'Đang xóa...'
                            : 'Xóa'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}