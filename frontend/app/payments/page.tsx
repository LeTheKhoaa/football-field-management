'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/src/components/AdminLayout';
import PaymentForm from '@/src/components/PaymentForm';
import api from '@/src/services/axios';

type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'E_WALLET';

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

interface Booking {
  id: number;
  bookingCode: string;
  customerId: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number | string;
  depositAmount: number | string;
  customer?: Customer;
}

interface Payment {
  id: number;
  bookingId: number;
  amount: number | string;
  method: PaymentMethod;
  transactionCode?: string | null;
  note?: string | null;
  paidAt: string;
  createdAt: string;
  booking?: Booking;
}

const paymentMethodOptions: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  {
    value: 'CASH',
    label: 'Tiền mặt',
  },
  {
    value: 'BANK_TRANSFER',
    label: 'Chuyển khoản ngân hàng',
  },
  {
    value: 'E_WALLET',
    label: 'Ví điện tử',
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

function formatDateTime(value?: string) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getPaymentMethodLabel(method: PaymentMethod) {
  const option = paymentMethodOptions.find(
    (item) => item.value === method,
  );

  return option?.label ?? method;
}

function getPaymentMethodClass(method: PaymentMethod) {
  switch (method) {
    case 'CASH':
      return 'bg-emerald-100 text-emerald-700';

    case 'BANK_TRANSFER':
      return 'bg-blue-100 text-blue-700';

    case 'E_WALLET':
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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [selectedBookingId, setSelectedBookingId] =
    useState('');

  const [selectedMethod, setSelectedMethod] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  const loadBookings = useCallback(async () => {
    try {
      const response = await api.get<Booking[]>('/bookings');

      setBookings(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      console.error(
        'Không thể tải danh sách đơn đặt sân:',
        error,
      );

      setBookings([]);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await api.get<Payment[]>('/payments', {
        params: {
          ...(selectedBookingId
            ? {
                bookingId: selectedBookingId,
              }
            : {}),
          ...(selectedMethod
            ? {
                method: selectedMethod,
              }
            : {}),
        },
      });

      setPayments(
        Array.isArray(response.data) ? response.data : [],
      );
    } catch (error) {
      console.error(
        'Không thể tải danh sách thanh toán:',
        error,
      );

      setErrorMessage(
        getErrorMessage(
          error,
          'Không thể tải danh sách giao dịch thanh toán.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [selectedBookingId, selectedMethod]);

  useEffect(() => {
    void Promise.all([loadBookings(), loadPayments()]);
  }, [loadBookings, loadPayments]);

  const totalPaymentAmount = useMemo(() => {
    return payments.reduce((total, payment) => {
      const amount = Number(payment.amount);

      return Number.isNaN(amount) ? total : total + amount;
    }, 0);
  }, [payments]);

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

    void Promise.all([loadBookings(), loadPayments()]);
  }

  function handleClearFilters() {
    setSelectedBookingId('');
    setSelectedMethod('');
  }

  async function handleDelete(payment: Payment) {
    const bookingCode =
      payment.booking?.bookingCode ??
      `đơn #${payment.bookingId}`;

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa giao dịch ${formatCurrency(
        payment.amount,
      )} của ${bookingCode} không?\n\nSau khi xóa, trạng thái thanh toán của đơn sẽ được backend tính lại.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(payment.id);

      await api.delete(`/payments/${payment.id}`);

      await Promise.all([loadBookings(), loadPayments()]);

      window.alert('Xóa giao dịch thanh toán thành công.');
    } catch (error) {
      console.error(
        'Không thể xóa giao dịch thanh toán:',
        error,
      );

      window.alert(
        getErrorMessage(
          error,
          'Không thể xóa giao dịch thanh toán.',
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
            Quản lý thanh toán
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và ghi nhận các giao dịch thanh toán
            của đơn đặt sân.
          </p>
        </div>

        <button
          type="button"
          onClick={
            showForm ? handleCloseForm : handleOpenForm
          }
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          {showForm
            ? 'Đóng form'
            : '+ Thêm giao dịch'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <PaymentForm
            onSaved={handleSaved}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-medium text-slate-500">
            Số giao dịch đang hiển thị
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {payments.length}
          </p>
        </div>

        <div className="rounded-lg bg-white p-5 shadow">
          <p className="text-sm font-medium text-slate-500">
            Tổng tiền đang hiển thị
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-700">
            {formatCurrency(totalPaymentAmount)}
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto_auto] xl:items-end">
          <div>
            <label
              htmlFor="payment-booking-filter"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Lọc theo đơn đặt sân
            </label>

            <select
              id="payment-booking-filter"
              value={selectedBookingId}
              onChange={(event) =>
                setSelectedBookingId(event.target.value)
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Tất cả đơn đặt sân</option>

              {bookings.map((booking) => (
                <option
                  key={booking.id}
                  value={booking.id}
                >
                  {booking.bookingCode} -{' '}
                  {booking.customer?.fullName ??
                    `Khách hàng #${booking.customerId}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-method-filter"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Lọc theo phương thức
            </label>

            <select
              id="payment-method-filter"
              value={selectedMethod}
              onChange={(event) =>
                setSelectedMethod(event.target.value)
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                Tất cả phương thức
              </option>

              {paymentMethodOptions.map((option) => (
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
            onClick={() => void loadPayments()}
            disabled={loading}
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>

          <button
            type="button"
            onClick={handleClearFilters}
            disabled={
              loading ||
              (!selectedBookingId && !selectedMethod)
            }
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-6 text-slate-600">
            Đang tải danh sách giao dịch thanh toán...
          </p>
        ) : errorMessage ? (
          <div className="p-6">
            <p className="mb-4 text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadPayments()}
              className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Tải lại
            </button>
          </div>
        ) : payments.length === 0 ? (
          <p className="p-6 text-slate-600">
            Chưa có giao dịch thanh toán phù hợp.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px]">
              <thead className="border-b bg-slate-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    ID
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Đơn đặt sân
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Khách hàng
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Số tiền
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Phương thức
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Mã giao dịch
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Ghi chú
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Thời gian
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => {
                  const isDeleting =
                    deletingId === payment.id;

                  return (
                    <tr
                      key={payment.id}
                      className="border-b align-top transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="p-4 font-medium text-slate-700">
                        #{payment.id}
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-slate-800">
                          {payment.booking?.bookingCode ??
                            `Đơn #${payment.bookingId}`}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Booking ID: {payment.bookingId}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="font-medium text-slate-800">
                          {payment.booking?.customer
                            ?.fullName ?? '—'}
                        </p>

                        {payment.booking?.customer?.phone && (
                          <p className="mt-1 text-sm text-slate-500">
                            {
                              payment.booking.customer
                                .phone
                            }
                          </p>
                        )}
                      </td>

                      <td className="p-4 text-right text-lg font-bold text-emerald-700">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentMethodClass(
                            payment.method,
                          )}`}
                        >
                          {getPaymentMethodLabel(
                            payment.method,
                          )}
                        </span>
                      </td>

                      <td className="p-4 text-sm text-slate-700">
                        {payment.transactionCode?.trim() ||
                          '—'}
                      </td>

                      <td className="max-w-xs p-4 text-sm text-slate-600">
                        <p className="whitespace-pre-wrap break-words">
                          {payment.note?.trim() || '—'}
                        </p>
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {formatDateTime(
                          payment.paidAt ??
                            payment.createdAt,
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(payment)
                          }
                          disabled={isDeleting}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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