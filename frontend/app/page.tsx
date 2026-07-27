'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/src/components/AdminLayout';
import api from '@/src/services/axios';

type FieldStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

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

interface Field {
  id: number;
  code: string;
  name: string;
  status: FieldStatus;
}

interface Customer {
  id: number;
  fullName: string;
  phone: string;
}

interface Booking {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number | string;
  createdAt: string;
}

interface Payment {
  id: number;
  amount: number | string;
  paidAt: string;
}

interface DashboardData {
  fields: Field[];
  customers: Customer[];
  bookings: Booking[];
  payments: Payment[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('vi-VN');
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

  return 'Không thể tải dữ liệu tổng quan.';
}

export default function Home() {
  const [data, setData] = useState<DashboardData>({
    fields: [],
    customers: [],
    bookings: [],
    payments: [],
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const [
        fieldsResponse,
        customersResponse,
        bookingsResponse,
        paymentsResponse,
      ] = await Promise.all([
        api.get<Field[]>('/fields'),
        api.get<Customer[]>('/customers'),
        api.get<Booking[]>('/bookings'),
        api.get<Payment[]>('/payments'),
      ]);

      setData({
        fields: Array.isArray(fieldsResponse.data)
          ? fieldsResponse.data
          : [],
        customers: Array.isArray(customersResponse.data)
          ? customersResponse.data
          : [],
        bookings: Array.isArray(bookingsResponse.data)
          ? bookingsResponse.data
          : [],
        payments: Array.isArray(paymentsResponse.data)
          ? paymentsResponse.data
          : [],
      });
    } catch (error) {
      console.error('Không thể tải dashboard:', error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const statistics = useMemo(() => {
    const activeFields = data.fields.filter(
      (field) => field.status === 'ACTIVE',
    ).length;

    const pendingBookings = data.bookings.filter(
      (booking) => booking.status === 'PENDING',
    ).length;

    const confirmedBookings = data.bookings.filter(
      (booking) => booking.status === 'CONFIRMED',
    ).length;

    const unpaidBookings = data.bookings.filter(
      (booking) =>
        booking.status !== 'CANCELLED' &&
        booking.paymentStatus !== 'PAID',
    ).length;

    const totalRevenue = data.payments.reduce(
      (total, payment) => {
        const amount = Number(payment.amount);

        return Number.isNaN(amount) ? total : total + amount;
      },
      0,
    );

    const today = new Date();

    const todayRevenue = data.payments.reduce(
      (total, payment) => {
        const paidDate = new Date(payment.paidAt);

        if (Number.isNaN(paidDate.getTime())) {
          return total;
        }

        const isToday =
          paidDate.getDate() === today.getDate() &&
          paidDate.getMonth() === today.getMonth() &&
          paidDate.getFullYear() === today.getFullYear();

        if (!isToday) {
          return total;
        }

        const amount = Number(payment.amount);

        return Number.isNaN(amount) ? total : total + amount;
      },
      0,
    );

    return {
      activeFields,
      pendingBookings,
      confirmedBookings,
      unpaidBookings,
      totalRevenue,
      todayRevenue,
    };
  }, [data]);

  const recentBookings = useMemo(() => {
    return [...data.bookings]
      .sort((first, second) => {
        return (
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
        );
      })
      .slice(0, 5);
  }, [data.bookings]);

  function getBookingStatusLabel(status: BookingStatus) {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';

      case 'CONFIRMED':
        return 'Đã xác nhận';

      case 'COMPLETED':
        return 'Hoàn thành';

      case 'CANCELLED':
        return 'Đã hủy';

      default:
        return status;
    }
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
        return 'Thanh toán một phần';

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

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Tổng quan
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Theo dõi hoạt động của hệ thống quản lý sân bóng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Đang tải...' : 'Tải lại dữ liệu'}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng số sân
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {data.fields.length}
              </p>

              <p className="mt-2 text-sm text-emerald-600">
                {statistics.activeFields} sân đang hoạt động
              </p>
            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-2xl">
              ⚽
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng khách hàng
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {data.customers.length}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Khách hàng trong hệ thống
              </p>
            </div>

            <div className="rounded-lg bg-violet-100 p-3 text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng đơn đặt sân
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {data.bookings.length}
              </p>

              <p className="mt-2 text-sm text-amber-600">
                {statistics.pendingBookings} đơn chờ xác nhận
              </p>
            </div>

            <div className="rounded-lg bg-amber-100 p-3 text-2xl">
              📅
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Tổng doanh thu
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-700">
                {formatCurrency(statistics.totalRevenue)}
              </p>

              <p className="mt-2 text-sm text-emerald-600">
                Hôm nay: {formatCurrency(statistics.todayRevenue)}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-100 p-3 text-2xl">
              💰
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border-l-4 border-blue-500 bg-white p-5 shadow">
          <p className="text-sm font-medium text-slate-500">
            Đơn đã xác nhận
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-700">
            {statistics.confirmedBookings}
          </p>
        </div>

        <div className="rounded-xl border-l-4 border-amber-500 bg-white p-5 shadow">
          <p className="text-sm font-medium text-slate-500">
            Đơn chờ xác nhận
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-700">
            {statistics.pendingBookings}
          </p>
        </div>

        <div className="rounded-xl border-l-4 border-red-500 bg-white p-5 shadow">
          <p className="text-sm font-medium text-slate-500">
            Đơn chưa thanh toán đủ
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">
            {statistics.unpaidBookings}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Đơn đặt sân gần đây
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              5 đơn được tạo gần nhất.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="p-6 text-slate-600">
            Đang tải dữ liệu tổng quan...
          </p>
        ) : recentBookings.length === 0 ? (
          <p className="p-6 text-slate-600">
            Chưa có đơn đặt sân.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Mã đơn
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Ngày tạo
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Tổng tiền
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Trạng thái đơn
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Thanh toán
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-t transition hover:bg-slate-50"
                  >
                    <td className="p-4 font-semibold text-slate-800">
                      {booking.bookingCode}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {formatDate(booking.createdAt)}
                    </td>

                    <td className="p-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(
                        Number(booking.totalAmount) || 0,
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getBookingStatusClass(
                          booking.status,
                        )}`}
                      >
                        {getBookingStatusLabel(booking.status)}
                      </span>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}