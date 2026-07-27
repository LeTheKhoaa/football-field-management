'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/src/components/AdminLayout';
import FieldForm, {
  FieldFormData,
} from '@/src/components/FieldForm';
import api from '@/src/services/axios';

interface FieldType {
  id: number;
  name: string;
}

interface Field extends FieldFormData {
  fieldType?: FieldType;
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Hoạt động';

    case 'INACTIVE':
      return 'Ngừng hoạt động';

    case 'MAINTENANCE':
      return 'Bảo trì';

    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700';

    case 'INACTIVE':
      return 'bg-red-100 text-red-700';

    case 'MAINTENANCE':
      return 'bg-yellow-100 text-yellow-700';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(
    null,
  );

  const editingField =
    fields.find((field) => field.id === editingId) ?? null;

  const loadFields = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await api.get<Field[]>('/fields');

      setFields(response.data);
    } catch (error) {
      console.error('Không thể tải danh sách sân:', error);

      setErrorMessage(
        'Không thể tải danh sách sân. Hãy kiểm tra Backend.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  function handleOpenCreateForm() {
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(fieldId: number) {
    setEditingId(fieldId);
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
    void loadFields();
  }

  async function handleDelete(id: number) {
  const confirmed = window.confirm(
    'Bạn có chắc chắn muốn xóa sân này?',
  );

  if (!confirmed) {
    return;
  }

  try {
    await api.delete(`/fields/${id}`);

    await loadFields();

    alert('Xóa sân thành công.');
  } catch (error) {
    console.error(error);

    alert('Không thể xóa sân.');
  }
}

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Quản lý sân
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Quản lý danh sách và trạng thái các sân bóng.
          </p>
        </div>

        <button
          type="button"
          onClick={
            showForm ? handleCloseForm : handleOpenCreateForm
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          {showForm ? 'Đóng form' : '+ Thêm sân'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <FieldForm
            key={editingField?.id ?? 'create'}
            initialData={editingField}
            onSaved={handleSaved}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {loading ? (
          <p className="p-6 text-slate-600">
            Đang tải danh sách sân...
          </p>
        ) : errorMessage ? (
          <p className="p-6 text-red-600">
            {errorMessage}
          </p>
        ) : fields.length === 0 ? (
          <p className="p-6 text-slate-600">
            Chưa có sân nào trong hệ thống.
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
                    Mã sân
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Tên sân
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Loại sân
                  </th>

                  <th className="p-4 text-left text-sm font-semibold text-slate-700">
                    Trạng thái
                  </th>

                  <th className="p-4 text-right text-sm font-semibold text-slate-700">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody>
                {fields.map((field) => (
                  <tr
                    key={field.id}
                    className="border-b transition last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="p-4 text-sm text-slate-600">
                      {field.id}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {field.code}
                    </td>

                    <td className="p-4 font-medium text-slate-800">
                      {field.name}
                    </td>

                    <td className="p-4 text-sm text-slate-600">
                      {field.fieldType?.name ?? 'Chưa xác định'}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          field.status,
                        )}`}
                      >
                        {getStatusLabel(field.status)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(field.id)}
                        className="mr-2 rounded-md bg-amber-500 px-3 py-1.5 text-sm text-white transition hover:bg-amber-600"
                      >
                        Sửa
                      </button>

                      <button
  type="button"
  onClick={() => void handleDelete(field.id)}
  className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white transition hover:bg-red-700"
>
  Xóa
</button>
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