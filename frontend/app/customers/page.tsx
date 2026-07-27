'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/src/components/AdminLayout';
import CustomerForm, {
  CustomerFormData,
} from '@/src/components/CustomerForm';
import api from '@/src/services/axios';

interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  createdAt?: string;
  updatedAt?: string;
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

  return 'Không thể xóa khách hàng. Vui lòng thử lại.';
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(
    null,
  );

  const [deletingId, setDeletingId] = useState<number | null>(
    null,
  );

  const editingCustomer =
    customers.find((customer) => customer.id === editingId) ??
    null;

  const editingFormData: CustomerFormData | null =
    editingCustomer
      ? {
          id: editingCustomer.id,
          fullName: editingCustomer.fullName,
          phone: editingCustomer.phone,
          email: editingCustomer.email,
          address: editingCustomer.address,
        }
      : null;

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response =
        await api.get<Customer[]>('/customers');

      setCustomers(response.data);
    } catch (error) {
      console.error(
        'Không thể tải danh sách khách hàng:',
        error,
      );

      setErrorMessage(
        'Không thể tải danh sách khách hàng. Hãy kiểm tra Backend.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

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
    void loadCustomers();
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa khách hàng "${customer.fullName}" không?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(customer.id);

      await api.delete(`/customers/${customer.id}`);

      if (editingId === customer.id) {
        handleCloseForm();
      }

      await loadCustomers();

      window.alert('Xóa khách hàng thành công.');
    } catch (error) {
      console.error('Không thể xóa khách hàng:', error);

      const backendMessage = getErrorMessage(error);

      window.alert(
        backendMessage ===
          'Không thể xóa khách hàng. Vui lòng thử lại.'
          ? 'Không thể xóa khách hàng. Khách hàng này có thể đã có đơn đặt sân.'
          : backendMessage,
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Quản lý khách hàng
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý thông tin khách hàng đặt sân.
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
          {showForm
            ? 'Đóng form'
            : '+ Thêm khách hàng'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CustomerForm
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
            Đang tải danh sách khách hàng...
          </p>
        ) : errorMessage ? (
          <div className="p-6">
            <p className="mb-4 text-red-600">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadCustomers()}
              className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Tải lại
            </button>
          </div>
        ) : customers.length === 0 ? (
          <p className="p-6 text-slate-600">
            Chưa có khách hàng nào trong hệ thống.
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
                    Họ và tên
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Số điện thoại
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Email
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Địa chỉ
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
                {customers.map((customer) => {
                  const isDeleting =
                    deletingId === customer.id;

                  return (
                    <tr
                      key={customer.id}
                      className="border-b transition last:border-b-0 hover:bg-slate-50"
                    >
                      <td className="p-4 text-sm text-slate-600">
                        {customer.id}
                      </td>

                      <td className="p-4 font-medium text-slate-800">
                        {customer.fullName}
                      </td>

                      <td className="p-4 text-slate-700">
                        {customer.phone}
                      </td>

                      <td className="p-4 text-slate-700">
                        {customer.email || '—'}
                      </td>

                      <td className="max-w-xs p-4 text-slate-700">
                        <p
                          className="truncate"
                          title={customer.address || ''}
                        >
                          {customer.address || '—'}
                        </p>
                      </td>

                      <td className="p-4 text-sm text-slate-600">
                        {formatDate(customer.createdAt)}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(customer.id)
                          }
                          disabled={isDeleting}
                          className="mr-2 rounded-md bg-amber-500 px-3 py-1.5 text-sm text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(customer)
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