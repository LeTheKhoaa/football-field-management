'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
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

type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'E_WALLET';

interface Customer {
  id: number;
  fullName: string;
  phone: string;
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
}

interface CreatePaymentPayload {
  bookingId: number;
  amount: number;
  method: PaymentMethod;
  transactionCode?: string;
  note?: string;
}

interface PaymentFormProps {
  onSaved: () => void;
  onCancel: () => void;
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

function formatCurrency(value: number | string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
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

  return 'Không thể tạo giao dịch thanh toán.';
}

export default function PaymentForm({
  onSaved,
  onCancel,
}: PaymentFormProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [bookingId, setBookingId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] =
    useState<PaymentMethod>('CASH');
  const [transactionCode, setTransactionCode] =
    useState('');
  const [note, setNote] = useState('');

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setErrorMessage('');

        const [bookingsResponse, paymentsResponse] =
          await Promise.all([
            api.get<Booking[]>('/bookings'),
            api.get<Payment[]>('/payments'),
          ]);

        setBookings(
          Array.isArray(bookingsResponse.data)
            ? bookingsResponse.data
            : [],
        );

        setPayments(
          Array.isArray(paymentsResponse.data)
            ? paymentsResponse.data
            : [],
        );
      } catch (error) {
        console.error(
          'Không thể tải dữ liệu form thanh toán:',
          error,
        );

        setErrorMessage(
          'Không thể tải danh sách đơn đặt sân hoặc giao dịch thanh toán.',
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  const paidAmountsByBooking = useMemo(() => {
    return payments.reduce<Record<number, number>>(
      (result, payment) => {
        const paymentAmount = Number(payment.amount);

        if (!Number.isNaN(paymentAmount)) {
          result[payment.bookingId] =
            (result[payment.bookingId] ?? 0) +
            paymentAmount;
        }

        return result;
      },
      {},
    );
  }, [payments]);

  const availableBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.status !== 'CANCELLED' &&
        booking.paymentStatus !== 'PAID',
    );
  }, [bookings]);

  const selectedBooking = useMemo(() => {
    const selectedId = Number(bookingId);

    if (!selectedId) {
      return null;
    }

    return (
      bookings.find(
        (booking) => booking.id === selectedId,
      ) ?? null
    );
  }, [bookingId, bookings]);

  const selectedBookingPaidAmount = useMemo(() => {
    if (!selectedBooking) {
      return 0;
    }

    return paidAmountsByBooking[selectedBooking.id] ?? 0;
  }, [paidAmountsByBooking, selectedBooking]);

  const selectedBookingTotalAmount = useMemo(() => {
    if (!selectedBooking) {
      return 0;
    }

    const total = Number(selectedBooking.totalAmount);

    return Number.isNaN(total) ? 0 : total;
  }, [selectedBooking]);

  const remainingAmount = useMemo(() => {
    return Math.max(
      selectedBookingTotalAmount -
        selectedBookingPaidAmount,
      0,
    );
  }, [
    selectedBookingPaidAmount,
    selectedBookingTotalAmount,
  ]);

  function handleBookingChange(value: string) {
    setBookingId(value);
    setAmount('');
    setErrorMessage('');
  }

  function fillRemainingAmount() {
    if (remainingAmount <= 0) {
      return;
    }

    setAmount(String(remainingAmount));
  }

  function validateForm() {
    if (!bookingId) {
      return 'Vui lòng chọn đơn đặt sân.';
    }

    if (!selectedBooking) {
      return 'Không tìm thấy đơn đặt sân đã chọn.';
    }

    if (selectedBooking.status === 'CANCELLED') {
      return 'Không thể thanh toán cho đơn đã hủy.';
    }

    if (selectedBooking.paymentStatus === 'PAID') {
      return 'Đơn đặt sân đã được thanh toán đủ.';
    }

    if (!amount) {
      return 'Vui lòng nhập số tiền thanh toán.';
    }

    const paymentAmount = Number(amount);

    if (
      Number.isNaN(paymentAmount) ||
      paymentAmount < 1
    ) {
      return 'Số tiền thanh toán phải lớn hơn hoặc bằng 1.';
    }

    if (paymentAmount > remainingAmount) {
      return `Số tiền thanh toán không được vượt quá ${formatCurrency(
        remainingAmount,
      )}.`;
    }

    if (!method) {
      return 'Vui lòng chọn phương thức thanh toán.';
    }

    if (transactionCode.trim().length > 100) {
      return 'Mã giao dịch không được vượt quá 100 ký tự.';
    }

    if (note.trim().length > 1000) {
      return 'Ghi chú không được vượt quá 1000 ký tự.';
    }

    return '';
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const payload: CreatePaymentPayload = {
      bookingId: Number(bookingId),
      amount: Number(amount),
      method,
    };

    const trimmedTransactionCode =
      transactionCode.trim();

    const trimmedNote = note.trim();

    if (trimmedTransactionCode) {
      payload.transactionCode =
        trimmedTransactionCode;
    }

    if (trimmedNote) {
      payload.note = trimmedNote;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      await api.post('/payments', payload);

      window.alert('Tạo giao dịch thanh toán thành công.');

      onSaved();
    } catch (error) {
      console.error(
        'Không thể tạo giao dịch thanh toán:',
        error,
      );

      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingOptions) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-slate-600">
          Đang tải dữ liệu form thanh toán...
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
          Thêm giao dịch thanh toán
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Ghi nhận khoản thanh toán cho một đơn đặt sân.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div>
        <label
          htmlFor="payment-booking"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Đơn đặt sân{' '}
          <span className="text-red-600">*</span>
        </label>

        <select
          id="payment-booking"
          value={bookingId}
          onChange={(event) =>
            handleBookingChange(event.target.value)
          }
          disabled={submitting}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        >
          <option value="">
            -- Chọn đơn đặt sân --
          </option>

          {availableBookings.map((booking) => (
            <option
              key={booking.id}
              value={booking.id}
            >
              {booking.bookingCode} -{' '}
              {booking.customer?.fullName ??
                `Khách hàng #${booking.customerId}`}
              {' - Còn '}
              {formatCurrency(
                Math.max(
                  Number(booking.totalAmount) -
                    (paidAmountsByBooking[
                      booking.id
                    ] ?? 0),
                  0,
                ),
              )}
            </option>
          ))}
        </select>

        {availableBookings.length === 0 && (
          <p className="mt-1 text-sm text-amber-600">
            Không có đơn đặt sân nào đang chờ thanh toán.
          </p>
        )}
      </div>

      {selectedBooking && (
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Mã đơn
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {selectedBooking.bookingCode}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Tổng tiền
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {formatCurrency(
                  selectedBookingTotalAmount,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Đã thanh toán
              </p>

              <p className="mt-1 font-semibold text-emerald-700">
                {formatCurrency(
                  selectedBookingPaidAmount,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-slate-500">
                Còn lại
              </p>

              <p className="mt-1 text-lg font-bold text-red-700">
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="payment-amount"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Số tiền thanh toán{' '}
            <span className="text-red-600">*</span>
          </label>

          <div className="flex gap-2">
            <input
              id="payment-amount"
              type="number"
              min="1"
              max={
                selectedBooking
                  ? remainingAmount
                  : undefined
              }
              step="1"
              value={amount}
              onChange={(event) =>
                setAmount(event.target.value)
              }
              disabled={
                submitting || !selectedBooking
              }
              placeholder="Ví dụ: 100000"
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />

            <button
              type="button"
              onClick={fillRemainingAmount}
              disabled={
                submitting ||
                !selectedBooking ||
                remainingAmount <= 0
              }
              className="shrink-0 rounded-md bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Thanh toán đủ
            </button>
          </div>

          {selectedBooking && (
            <p className="mt-1 text-sm text-slate-500">
              Tối đa:{' '}
              <span className="font-medium">
                {formatCurrency(remainingAmount)}
              </span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="payment-method"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Phương thức thanh toán{' '}
            <span className="text-red-600">*</span>
          </label>

          <select
            id="payment-method"
            value={method}
            onChange={(event) =>
              setMethod(
                event.target.value as PaymentMethod,
              )
            }
            disabled={submitting}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
          >
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
      </div>

      <div className="mt-5">
        <label
          htmlFor="payment-transaction-code"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Mã giao dịch
        </label>

        <input
          id="payment-transaction-code"
          type="text"
          maxLength={100}
          value={transactionCode}
          onChange={(event) =>
            setTransactionCode(event.target.value)
          }
          disabled={submitting}
          placeholder="Ví dụ: FT20260727001"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />

        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Có thể bỏ trống khi thanh toán bằng tiền mặt.
          </p>

          <p className="text-xs text-slate-500">
            {transactionCode.length}/100
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="payment-note"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Ghi chú
        </label>

        <textarea
          id="payment-note"
          rows={4}
          maxLength={1000}
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          disabled={submitting}
          placeholder="Nhập ghi chú cho giao dịch..."
          className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
        />

        <p className="mt-1 text-right text-xs text-slate-500">
          {note.length}/1000
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
            availableBookings.length === 0
          }
          className="rounded-md bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? 'Đang thanh toán...'
            : 'Xác nhận thanh toán'}
        </button>
      </div>
    </form>
  );
}