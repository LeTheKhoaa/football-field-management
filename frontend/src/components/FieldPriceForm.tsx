'use client';

import { FormEvent, useEffect, useState } from 'react';
import api from '@/src/services/axios';

interface Field {
  id: number;
  name: string;
}

interface TimeSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

export interface FieldPriceFormData {
  id: number;
  fieldId: number;
  timeSlotId: number;
  price: number;
}

interface FieldPriceFormProps {
  initialData?: FieldPriceFormData | null;
  onSaved: () => void;
  onCancel: () => void;
}

function formatTime(value: string) {
  if (!value) {
    return '';
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

  return 'Không thể lưu bảng giá. Hãy kiểm tra lại dữ liệu.';
}

export default function FieldPriceForm({
  initialData,
  onSaved,
  onCancel,
}: FieldPriceFormProps) {
  const [fields, setFields] = useState<Field[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const [fieldId, setFieldId] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const [price, setPrice] = useState('');

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setErrorMessage('');

        const [fieldsResponse, timeSlotsResponse] =
          await Promise.all([
            api.get<Field[]>('/fields'),
            api.get<TimeSlot[]>('/time-slots'),
          ]);

        setFields(fieldsResponse.data);
        setTimeSlots(timeSlotsResponse.data);
      } catch (error) {
        console.error('Không thể tải dữ liệu cho form:', error);

        setErrorMessage(
          'Không thể tải danh sách sân hoặc khung giờ.',
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFieldId(String(initialData.fieldId));
      setTimeSlotId(String(initialData.timeSlotId));
      setPrice(String(initialData.price));
      return;
    }

    setFieldId('');
    setTimeSlotId('');
    setPrice('');
  }, [initialData]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedFieldId = Number(fieldId);
    const parsedTimeSlotId = Number(timeSlotId);
    const parsedPrice = Number(price);

    if (!Number.isInteger(parsedFieldId) || parsedFieldId <= 0) {
      setErrorMessage('Vui lòng chọn sân.');
      return;
    }

    if (
      !Number.isInteger(parsedTimeSlotId) ||
      parsedTimeSlotId <= 0
    ) {
      setErrorMessage('Vui lòng chọn khung giờ.');
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setErrorMessage(
        'Giá thuê phải là số hợp lệ và không được nhỏ hơn 0.',
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const payload = {
        fieldId: parsedFieldId,
        timeSlotId: parsedTimeSlotId,
        price: parsedPrice,
      };

      if (initialData) {
        await api.patch(
          `/field-prices/${initialData.id}`,
          payload,
        );
      } else {
        await api.post('/field-prices', payload);
      }

      onSaved();
    } catch (error) {
      console.error('Không thể lưu bảng giá:', error);
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
          ? 'Cập nhật bảng giá'
          : 'Thêm bảng giá'}
      </h2>

      {errorMessage && (
        <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {loadingOptions ? (
        <p className="text-slate-600">
          Đang tải danh sách sân và khung giờ...
        </p>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="fieldId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sân
              </label>

              <select
                id="fieldId"
                required
                value={fieldId}
                onChange={(event) =>
                  setFieldId(event.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">-- Chọn sân --</option>

                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="timeSlotId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Khung giờ
              </label>

              <select
                id="timeSlotId"
                required
                value={timeSlotId}
                onChange={(event) =>
                  setTimeSlotId(event.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">
                  -- Chọn khung giờ --
                </option>

                {timeSlots.map((timeSlot) => (
                  <option
                    key={timeSlot.id}
                    value={timeSlot.id}
                  >
                    {timeSlot.name} (
                    {formatTime(timeSlot.startTime)} -{' '}
                    {formatTime(timeSlot.endTime)})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="price"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Giá thuê (đồng)
              </label>

              <input
                id="price"
                type="number"
                required
                min="0"
                step="1000"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="Ví dụ: 300000"
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {fields.length === 0 && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              Chưa có sân. Bạn cần tạo sân trước khi thêm bảng
              giá.
            </p>
          )}

          {timeSlots.length === 0 && (
            <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
              Chưa có khung giờ. Bạn cần tạo khung giờ trước khi
              thêm bảng giá.
            </p>
          )}

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
              disabled={
                saving ||
                fields.length === 0 ||
                timeSlots.length === 0
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Đang lưu...'
                : initialData
                  ? 'Lưu thay đổi'
                  : 'Lưu bảng giá'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}