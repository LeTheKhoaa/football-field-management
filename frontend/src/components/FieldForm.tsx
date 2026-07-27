'use client';

import { FormEvent, useState } from 'react';
import api from '@/src/services/axios';

export interface FieldFormData {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  status: string;
  fieldTypeId: number;
}

interface FieldFormProps {
  initialData?: FieldFormData | null;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function FieldForm({
  initialData,
  onSaved,
  onCancel,
}: FieldFormProps) {
  const isEditing = initialData != null;

  const [code, setCode] = useState(initialData?.code ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? '',
  );
  const [imageUrl, setImageUrl] = useState(
    initialData?.imageUrl ?? '',
  );
  const [status, setStatus] = useState(
    initialData?.status ?? 'ACTIVE',
  );
  const [fieldTypeId, setFieldTypeId] = useState(
    String(initialData?.fieldTypeId ?? 1),
  );

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage('');
      setIsError(false);

      const payload = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        status,
        fieldTypeId: Number(fieldTypeId),
      };

      if (initialData) {
        await api.patch(
          `/fields/${initialData.id}`,
          payload,
        );
      } else {
        await api.post('/fields', payload);
      }

      setMessage(
        isEditing
          ? 'Cập nhật sân thành công.'
          : 'Thêm sân thành công.',
      );

      onSaved?.();
    } catch (error) {
      console.error(
        isEditing
          ? 'Không thể cập nhật sân:'
          : 'Không thể thêm sân:',
        error,
      );

      setIsError(true);
      setMessage(
        isEditing
          ? 'Không thể cập nhật sân. Hãy kiểm tra dữ liệu.'
          : 'Không thể thêm sân. Hãy kiểm tra dữ liệu.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          {isEditing ? 'Cập nhật sân' : 'Thêm sân mới'}
        </h2>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-500 transition hover:text-slate-800"
          >
            Đóng
          </button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Mã sân
          </label>

          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            maxLength={30}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
            placeholder="Ví dụ: SAN-A2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Tên sân
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
            placeholder="Ví dụ: Sân bóng A2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Mã loại sân
          </label>

          <input
            type="number"
            value={fieldTypeId}
            onChange={(event) =>
              setFieldTypeId(event.target.value)
            }
            min={1}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Trạng thái
          </label>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
          >
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">
              Ngừng hoạt động
            </option>
            <option value="MAINTENANCE">Bảo trì</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Mô tả
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
            placeholder="Mô tả sân"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Đường dẫn hình ảnh
          </label>

          <input
            type="url"
            value={imageUrl}
            onChange={(event) =>
              setImageUrl(event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
            placeholder="https://example.com/field.jpg"
          />
        </div>

        {message && (
          <p
            className={`text-sm ${
              isError ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Đang lưu...'
              : isEditing
                ? 'Lưu thay đổi'
                : 'Lưu sân'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-lg border border-slate-300 px-5 py-2 text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
}