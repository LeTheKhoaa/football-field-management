'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/src/components/AdminLayout';
import FieldPriceForm, {
  FieldPriceFormData,
} from '@/src/components/FieldPriceForm';
import api from '@/src/services/axios';

interface FieldPrice {
  id: number;
  fieldId?: number;
  timeSlotId?: number;
  price: number | string;

  field: {
    id: number;
    name: string;
  };

  timeSlot: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
  };
}

function formatMoney(value: number | string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '—';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numericValue);
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

  return 'Không thể xóa bảng giá. Vui lòng thử lại.';
}

export default function FieldPricesPage() {
  const [prices, setPrices] = useState<FieldPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  const editingPrice =
    prices.find((item) => item.id === editingId) ?? null;

  const editingFormData: FieldPriceFormData | null =
    editingPrice
      ? {
          id: editingPrice.id,
          fieldId:
            editingPrice.fieldId ?? editingPrice.field.id,
          timeSlotId:
            editingPrice.timeSlotId ??
            editingPrice.timeSlot.id,
          price: Number(editingPrice.price),
        }
      : null;

  const loadPrices = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response =
        await api.get<FieldPrice[]>('/field-prices');

      setPrices(response.data);
    } catch (error) {
      console.error(
        'Không thể tải danh sách bảng giá:',
        error,
      );

      setErrorMessage(
        'Không thể tải danh sách bảng giá. Hãy kiểm tra Backend.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrices();
  }, [loadPrices]);

  function handleOpenCreateForm() {
    setEditingId(null);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
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
    void loadPrices();
  }

  async function handleDelete(item: FieldPrice) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa bảng giá của sân "${item.field.name}" tại khung giờ "${item.timeSlot.name}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(item.id);

      await api.delete(`/field-prices/${item.id}`);

      if (editingId === item.id) {
        handleCloseForm();
      }

      await loadPrices();

      window.alert('Xóa bảng giá thành công.');
    } catch (error) {
      console.error('Không thể xóa bảng giá:', error);

      window.alert(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Quản lý bảng giá
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý giá thuê sân theo từng khung giờ.
          </p>
        </div>

        <button
          type="button"
          onClick={
            showForm
              ? handleCloseForm
              : handleOpenCreateForm
          }
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          {showForm ? 'Đóng form' : '+ Thêm bảng giá'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <FieldPriceForm
            key={editingFormData?.id ?? 'create'}
            initialData={editingFormData}
            onSaved={handleSaved}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-6 text-slate-600">
            Đang tải danh sách bảng giá...
          </p>
        ) : errorMessage ? (
          <div className="p-6">
            <p className="mb-4 text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadPrices()}
              className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Tải lại
            </button>
          </div>
        ) : prices.length === 0 ? (
          <p className="p-6 text-slate-600">
            Chưa có bảng giá nào trong hệ thống.
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
                    Sân
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Khung giờ
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Giá
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {prices.map((item) => {
                  const isDeleting =
                    deletingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="border-b transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="p-4 text-sm text-slate-600">
                        {item.id}
                      </td>

                      <td className="p-4 font-medium text-slate-800">
                        {item.field?.name ?? '—'}
                      </td>

                      <td className="p-4 text-slate-700">
                        <p className="font-medium">
                          {item.timeSlot?.name ?? '—'}
                        </p>

                        {item.timeSlot && (
                          <p className="mt-1 text-xs text-slate-500">
                            {formatTime(
                              item.timeSlot.startTime,
                            )}{' '}
                            -{' '}
                            {formatTime(
                              item.timeSlot.endTime,
                            )}
                          </p>
                        )}
                      </td>

                      <td className="p-4 font-semibold text-emerald-700">
                        {formatMoney(item.price)}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleEdit(item.id)}
                          disabled={isDeleting}
                          className="mr-2 rounded-md bg-amber-500 px-3 py-1.5 text-sm text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(item)
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