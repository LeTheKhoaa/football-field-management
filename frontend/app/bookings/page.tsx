'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/src/components/AdminLayout';
import BookingForm from '@/src/components/BookingForm';
import api from '@/src/services/axios';

type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

type PaymentStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED';

interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
}

interface Field {
  id: number;
  code?: string;
  name: string;
}

interface TimeSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
}

interface BookingItem {
  id: number;
  fieldId: number;
  timeSlotId: number;
  playDate: string;
  unitPrice: number | string;
  field?: Field;
  timeSlot?: TimeSlot;
}

interface Booking {
  id: number;
  bookingCode: string;
  customerId: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number | string;
  depositAmount: number | string;
  note?: string | null;
  cancellationReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  customer?: Customer;
  items?: BookingItem[];
}

const bookingStatusOptions: Array<{
  value: BookingStatus;
  label: string;
}> = [
  {
    value: 'PENDING',
    label: 'Chờ xác nhận',
  },
  {
    value: 'CONFIRMED',
    label: 'Đã xác nhận',
  },
  {
    value: 'COMPLETED',
    label: 'Hoàn thành',
  },
  {
    value: 'CANCELLED',
    label: 'Đã hủy',
  },
];

function formatCurrency(value: number | string | undefined) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value?: string) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('vi-VN');
}

function getBookingStatusLabel(status: BookingStatus) {
  const option = bookingStatusOptions.find(
    (item) => item.value === status,
  );

  return option?.label ?? status;
}

function getBookingStatusClass(status: BookingStatus) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-700';

    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-700';

    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';

    case 'CANCELLED':
      return 'bg-red-100 text-red-700';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case 'UNPAID':
      return 'Chưa thanh toán';

    case 'PARTIALLY_PAID':
      return 'Đã thanh toán một phần';

    case 'PAID':
      return 'Đã thanh toán';

    case 'REFUNDED':
      return 'Đã hoàn tiền';

    default:
      return status;
  }
}

function getPaymentStatusClass(status: PaymentStatus) {
  switch (status) {
    case 'UNPAID':
      return 'bg-red-100 text-red-700';

    case 'PARTIALLY_PAID':
      return 'bg-amber-100 text-amber-700';

    case 'PAID':
      return 'bg-emerald-100 text-emerald-700';

    case 'REFUNDED':
      return 'bg-violet-100 text-violet-700';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
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

  return fallbackMessage;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [updatingId, setUpdatingId] = useState<number | null>(
    null,
  );

  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await api.get<Booking[]>('/bookings', {
        params: selectedStatus
          ? {
              status: selectedStatus,
            }
          : undefined,
      });

      setBookings(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      console.error(
        'Không thể tải danh sách đặt sân:',
        error,
      );

      setErrorMessage(
        getErrorMessage(
          error,
          'Không thể tải danh sách đặt sân. Hãy kiểm tra Backend.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  function handleOpenForm() {
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function handleCloseForm() {
    setShowForm(false);
  }

  function handleSaved() {
    setShowForm(false);
    void loadBookings();
  }

  async function handleUpdateStatus(
    booking: Booking,
    status: BookingStatus,
  ) {
    if (status === booking.status) {
      return;
    }

    const statusLabel = getBookingStatusLabel(status);

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn chuyển đơn "${booking.bookingCode}" sang trạng thái "${statusLabel}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingId(booking.id);

      await api.patch(`/bookings/${booking.id}/status`, {
        status,
      });

      await loadBookings();

      window.alert('Cập nhật trạng thái thành công.');
    } catch (error) {
      console.error(
        'Không thể cập nhật trạng thái đơn:',
        error,
      );

      window.alert(
        getErrorMessage(
          error,
          'Không thể cập nhật trạng thái đơn đặt sân.',
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(booking: Booking) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa đơn đặt sân "${booking.bookingCode}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(booking.id);

      await api.delete(`/bookings/${booking.id}`);

      await loadBookings();

      window.alert('Xóa đơn đặt sân thành công.');
    } catch (error) {
      console.error('Không thể xóa đơn đặt sân:', error);

      window.alert(
        getErrorMessage(
          error,
          'Không thể xóa đơn đặt sân. Đơn có thể đã phát sinh thanh toán.',
        ),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Quản lý đặt sân
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý các đơn đặt sân của khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={
            showForm ? handleCloseForm : handleOpenForm
          }
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          {showForm
            ? 'Đóng form'
            : '+ Thêm đơn đặt sân'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <BookingForm
            onSaved={handleSaved}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <label
              htmlFor="booking-status-filter"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Lọc theo trạng thái
            </label>

            <select
              id="booking-status-filter"
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả trạng thái</option>

              {bookingStatusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadBookings()}
            disabled={loading}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-6 text-slate-600">
            Đang tải danh sách đặt sân...
          </p>
        ) : errorMessage ? (
          <div className="p-6">
            <p className="mb-4 text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadBookings()}
              className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Tải lại
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <p className="p-6 text-slate-600">
            Chưa có đơn đặt sân nào trong hệ thống.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="border-b bg-slate-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Mã đơn
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Khách hàng
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Chi tiết đặt sân
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Tổng tiền
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Tiền cọc
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Thanh toán
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Trạng thái
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Ngày tạo
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => {
                  const isUpdating =
                    updatingId === booking.id;

                  const isDeleting =
                    deletingId === booking.id;

                  const isBusy = isUpdating || isDeleting;

                  return (
                    <tr
                      key={booking.id}
                      className="border-b align-top transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">
                          {booking.bookingCode}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ID: {booking.id}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-medium text-slate-800">
                          {booking.customer?.fullName ??
                            `Khách hàng #${booking.customerId}`}
                        </p>

                        {booking.customer?.phone && (
                          <p className="mt-1 text-sm text-slate-500">
                            {booking.customer.phone}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        {booking.items &&
                        booking.items.length > 0 ? (
                          <div className="space-y-3">
                            {booking.items.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-md border border-slate-200 bg-slate-50 p-3"
                              >
                                <p className="font-medium text-slate-800">
                                  {item.field?.name ??
                                    `Sân #${item.fieldId}`}
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                  {item.timeSlot?.name ??
                                    `Khung giờ #${item.timeSlotId}`}
                                </p>

                                {item.timeSlot && (
                                  <p className="text-sm text-slate-500">
                                    {item.timeSlot.startTime} -{' '}
                                    {item.timeSlot.endTime}
                                  </p>
                                )}

                                <p className="mt-1 text-sm text-slate-600">
                                  Ngày đá:{' '}
                                  {formatDate(item.playDate)}
                                </p>

                                <p className="mt-1 text-sm font-medium text-blue-700">
                                  {formatCurrency(
                                    item.unitPrice,
                                  )}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Chưa có chi tiết
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right font-semibold text-slate-800">
                        {formatCurrency(
                          booking.totalAmount,
                        )}
                      </td>

                      <td className="p-4 text-right text-slate-700">
                        {formatCurrency(
                          booking.depositAmount,
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStatusClass(
                            booking.paymentStatus,
                          )}`}
                        >
                          {getPaymentStatusLabel(
                            booking.paymentStatus,
                          )}
                        </span>
                      </td>

                      <td className="p-4">
                        <span
                          className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getBookingStatusClass(
                            booking.status,
                          )}`}
                        >
                          {getBookingStatusLabel(
                            booking.status,
                          )}
                        </span>

                        <select
                          value={booking.status}
                          onChange={(event) =>
                            void handleUpdateStatus(
                              booking,
                              event.target
                                .value as BookingStatus,
                            )
                          }
                          disabled={isBusy}
                          className="block w-40 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {bookingStatusOptions.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {formatDate(booking.createdAt)}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(booking)
                          }
                          disabled={isBusy}
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