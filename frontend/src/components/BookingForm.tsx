'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '@/src/services/axios';

interface Customer {
  id: number;
  fullName: string;
  phone: string;
}

interface Field {
  id: number;
  code: string;
  name: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

interface TimeSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

interface FieldPrice {
  id: number;
  fieldId: number;
  timeSlotId: number;
  price: number | string;
}

interface BookingItemFormData {
  fieldId: string;
  timeSlotId: string;
  playDate: string;
}

interface CreateBookingPayload {
  customerId: number;
  depositAmount?: number;
  note?: string;
  items: Array<{
    fieldId: number;
    timeSlotId: number;
    playDate: string;
  }>;
}

interface BookingFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

const emptyBookingItem = (): BookingItemFormData => ({
  fieldId: '',
  timeSlotId: '',
  playDate: '',
});

function formatCurrency(value: number | string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return '—';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

  return 'Không thể tạo đơn đặt sân. Vui lòng thử lại.';
}

export default function BookingForm({
  onSaved,
  onCancel,
}: BookingFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [fieldPrices, setFieldPrices] = useState<FieldPrice[]>(
    [],
  );

  const [customerId, setCustomerId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [note, setNote] = useState('');

  const [items, setItems] = useState<BookingItemFormData[]>([
    emptyBookingItem(),
  ]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setErrorMessage('');

        const [
          customersResponse,
          fieldsResponse,
          timeSlotsResponse,
          fieldPricesResponse,
        ] = await Promise.all([
          api.get<Customer[]>('/customers'),
          api.get<Field[]>('/fields'),
          api.get<TimeSlot[]>('/time-slots'),
          api.get<FieldPrice[]>('/field-prices'),
        ]);

        setCustomers(
          Array.isArray(customersResponse.data)
            ? customersResponse.data
            : [],
        );

        setFields(
          Array.isArray(fieldsResponse.data)
            ? fieldsResponse.data
            : [],
        );

        setTimeSlots(
          Array.isArray(timeSlotsResponse.data)
            ? timeSlotsResponse.data
            : [],
        );

        setFieldPrices(
          Array.isArray(fieldPricesResponse.data)
            ? fieldPricesResponse.data
            : [],
        );
      } catch (error) {
        console.error(
          'Không thể tải dữ liệu cho form đặt sân:',
          error,
        );

        setErrorMessage(
          'Không thể tải khách hàng, sân, khung giờ hoặc bảng giá.',
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  const availableFields = useMemo(
    () =>
      fields.filter(
        (field) =>
          !field.status || field.status === 'ACTIVE',
      ),
    [fields],
  );

  const availableTimeSlots = useMemo(
    () =>
      timeSlots.filter(
        (timeSlot) => timeSlot.isActive !== false,
      ),
    [timeSlots],
  );

  const estimatedTotal = useMemo(() => {
    return items.reduce((total, item) => {
      const fieldId = Number(item.fieldId);
      const timeSlotId = Number(item.timeSlotId);

      if (!fieldId || !timeSlotId) {
        return total;
      }

      const priceRecord = fieldPrices.find(
        (fieldPrice) =>
          fieldPrice.fieldId === fieldId &&
          fieldPrice.timeSlotId === timeSlotId,
      );

      if (!priceRecord) {
        return total;
      }

      const price = Number(priceRecord.price);

      return Number.isNaN(price) ? total : total + price;
    }, 0);
  }, [fieldPrices, items]);

  function updateItem(
    index: number,
    field: keyof BookingItemFormData,
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      emptyBookingItem(),
    ]);
  }

  function removeItem(index: number) {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return currentItems;
      }

      return currentItems.filter(
        (_, itemIndex) => itemIndex !== index,
      );
    });
  }

  function getItemPrice(item: BookingItemFormData) {
    const fieldId = Number(item.fieldId);
    const timeSlotId = Number(item.timeSlotId);

    if (!fieldId || !timeSlotId) {
      return null;
    }

    return (
      fieldPrices.find(
        (fieldPrice) =>
          fieldPrice.fieldId === fieldId &&
          fieldPrice.timeSlotId === timeSlotId,
      ) ?? null
    );
  }

  function validateForm() {
    if (!customerId) {
      return 'Vui lòng chọn khách hàng.';
    }

    if (items.length === 0) {
      return 'Phải có ít nhất một mục đặt sân.';
    }

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];

      if (!item.fieldId) {
        return `Vui lòng chọn sân cho mục ${index + 1}.`;
      }

      if (!item.timeSlotId) {
        return `Vui lòng chọn khung giờ cho mục ${
          index + 1
        }.`;
      }

      if (!item.playDate) {
        return `Vui lòng chọn ngày đá cho mục ${index + 1}.`;
      }

      if (item.playDate < getToday()) {
        return `Ngày đá của mục ${
          index + 1
        } không được nhỏ hơn ngày hiện tại.`;
      }

      const hasDuplicate = items.some(
        (otherItem, otherIndex) =>
          otherIndex !== index &&
          otherItem.fieldId === item.fieldId &&
          otherItem.timeSlotId === item.timeSlotId &&
          otherItem.playDate === item.playDate,
      );

      if (hasDuplicate) {
        return `Mục ${
          index + 1
        } bị trùng sân, khung giờ và ngày đá.`;
      }

      const priceRecord = getItemPrice(item);

      if (!priceRecord) {
        return `Sân và khung giờ tại mục ${
          index + 1
        } chưa được thiết lập giá.`;
      }
    }

    if (depositAmount) {
      const deposit = Number(depositAmount);

      if (Number.isNaN(deposit) || deposit < 0) {
        return 'Tiền cọc phải là số lớn hơn hoặc bằng 0.';
      }

      if (deposit > estimatedTotal) {
        return 'Tiền cọc không được lớn hơn tổng tiền dự kiến.';
      }
    }

    return '';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const payload: CreateBookingPayload = {
      customerId: Number(customerId),
      items: items.map((item) => ({
        fieldId: Number(item.fieldId),
        timeSlotId: Number(item.timeSlotId),
        playDate: item.playDate,
      })),
    };

    if (depositAmount !== '') {
      payload.depositAmount = Number(depositAmount);
    }

    const trimmedNote = note.trim();

    if (trimmedNote) {
      payload.note = trimmedNote;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      await api.post('/bookings', payload);

      window.alert('Tạo đơn đặt sân thành công.');

      onSaved();
    } catch (error) {
      console.error('Không thể tạo đơn đặt sân:', error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingOptions) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-slate-600">
          Đang tải dữ liệu form đặt sân...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-white p-6 shadow"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Thêm đơn đặt sân
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Chọn khách hàng và các sân cần đặt.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="booking-customer"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Khách hàng <span className="text-red-600">*</span>
          </label>

          <select
            id="booking-customer"
            value={customerId}
            onChange={(event) =>
              setCustomerId(event.target.value)
            }
            disabled={submitting}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
          >
            <option value="">-- Chọn khách hàng --</option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.fullName} - {customer.phone}
              </option>
            ))}
          </select>

          {customers.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">
              Chưa có khách hàng. Hãy thêm khách hàng trước.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="booking-deposit"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Tiền cọc
          </label>

          <input
            id="booking-deposit"
            type="number"
            min="0"
            step="1000"
            value={depositAmount}
            onChange={(event) =>
              setDepositAmount(event.target.value)
            }
            disabled={submitting}
            placeholder="Ví dụ: 200000"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800">
              Chi tiết sân đặt
            </h3>

            <p className="text-sm text-slate-500">
              Mỗi mục gồm sân, khung giờ và ngày đá.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={submitting}
            className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Thêm sân
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const priceRecord = getItemPrice(item);

            return (
              <div
                key={index}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700">
                    Mục đặt sân {index + 1}
                  </h4>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={
                      submitting || items.length === 1
                    }
                    className="rounded-md bg-red-100 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Xóa mục
                  </button>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <label
                      htmlFor={`booking-field-${index}`}
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Sân <span className="text-red-600">*</span>
                    </label>

                    <select
                      id={`booking-field-${index}`}
                      value={item.fieldId}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'fieldId',
                          event.target.value,
                        )
                      }
                      disabled={submitting}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="">-- Chọn sân --</option>

                      {availableFields.map((field) => (
                        <option
                          key={field.id}
                          value={field.id}
                        >
                          {field.code
                            ? `${field.code} - ${field.name}`
                            : field.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`booking-time-slot-${index}`}
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Khung giờ{' '}
                      <span className="text-red-600">*</span>
                    </label>

                    <select
                      id={`booking-time-slot-${index}`}
                      value={item.timeSlotId}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'timeSlotId',
                          event.target.value,
                        )
                      }
                      disabled={submitting}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    >
                      <option value="">
                        -- Chọn khung giờ --
                      </option>

                      {availableTimeSlots.map((timeSlot) => (
                        <option
                          key={timeSlot.id}
                          value={timeSlot.id}
                        >
                          {timeSlot.name} (
                          {timeSlot.startTime} -{' '}
                          {timeSlot.endTime})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor={`booking-play-date-${index}`}
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Ngày đá{' '}
                      <span className="text-red-600">*</span>
                    </label>

                    <input
                      id={`booking-play-date-${index}`}
                      type="date"
                      min={getToday()}
                      value={item.playDate}
                      onChange={(event) =>
                        updateItem(
                          index,
                          'playDate',
                          event.target.value,
                        )
                      }
                      disabled={submitting}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  {item.fieldId && item.timeSlotId ? (
                    priceRecord ? (
                      <p className="text-sm font-medium text-blue-700">
                        Đơn giá:{' '}
                        {formatCurrency(priceRecord.price)}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-red-600">
                        Sân và khung giờ này chưa được thiết
                        lập giá.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-slate-500">
                      Chọn sân và khung giờ để xem giá.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="booking-note"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Ghi chú
        </label>

        <textarea
          id="booking-note"
          rows={4}
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          disabled={submitting}
          placeholder="Nhập ghi chú cho đơn đặt sân..."
          className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />

        <p className="mt-1 text-right text-xs text-slate-500">
          {note.length}/1000
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-slate-700">
            Tổng tiền dự kiến
          </span>

          <span className="text-xl font-bold text-blue-700">
            {formatCurrency(estimatedTotal)}
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Tổng tiền chính thức sẽ do backend tính khi tạo đơn.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-slate-300 bg-white px-5 py-2 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={
            submitting ||
            customers.length === 0 ||
            availableFields.length === 0 ||
            availableTimeSlots.length === 0
          }
          className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? 'Đang tạo đơn...'
            : 'Tạo đơn đặt sân'}
        </button>
      </div>
    </form>
  );
}