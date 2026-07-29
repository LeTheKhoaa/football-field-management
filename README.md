# Football Field Management System

Football Field Management System là hệ thống quản lý sân bóng được xây dựng nhằm hỗ trợ quản trị viên quản lý sân, loại sân, khung giờ, giá thuê, khách hàng, lịch đặt sân và thanh toán.

Hệ thống cung cấp giao diện quản trị trực quan, giúp người quản lý theo dõi và cập nhật thông tin phục vụ hoạt động kinh doanh sân bóng.

## Thành viên thực hiện

- Lê Thế Khoa
- Nguyễn Ngọc Luật

Có thể chỉnh lại họ tên thành viên cho đúng với thông tin chính thức của nhóm.


## Mục tiêu dự án

- Tin học hóa quy trình quản lý sân bóng.
- Quản lý thông tin sân và loại sân.
- Quản lý các khung giờ hoạt động.
- Thiết lập giá thuê sân theo từng khung giờ.
- Quản lý thông tin khách hàng.
- Quản lý lịch đặt sân.
- Theo dõi trạng thái thanh toán.
- Hỗ trợ quản trị viên thống kê và theo dõi hoạt động hệ thống.

## Công nghệ sử dụng

### Backend

- NestJS
- TypeScript
- Prisma ORM
- MySQL
- RESTful API

### Frontend

- Next.js
- React
- TypeScript
- Axios
- Tailwind CSS

### Công cụ phát triển

- Visual Studio Code
- Git
- GitHub
- Postman
- MySQL Workbench

## Kiến trúc tổng quan

Dự án được tổ chức theo mô hình client-server:

- Frontend gửi yêu cầu HTTP đến Backend thông qua RESTful API.
- Backend xử lý nghiệp vụ và sử dụng Prisma ORM để truy xuất dữ liệu.
- Dữ liệu của hệ thống được lưu trữ trong cơ sở dữ liệu MySQL.

```text
Frontend (Next.js)
        |
        | HTTP / REST API
        v
Backend (NestJS)
        |
        | Prisma ORM
        v
Database (MySQL)


## Yêu cầu hệ thống

Trước khi chạy dự án cần cài đặt:

- Node.js (phiên bản 18 trở lên)
- MySQL Server
- Git
- Visual Studio Code

## Hướng dẫn cài đặt

### 1. Clone dự án

```bash
git clone <repository-url>
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` và cấu hình kết nối MySQL theo môi trường của bạn.

Sau đó thực hiện:

```bash
npx prisma generate
npx prisma migrate dev
```

Khởi động Backend:

```bash
npm run start:dev
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
npm run dev
```

## Kiểm thử

Backend hỗ trợ các lệnh kiểm thử:

```bash
npm test
npm run test:cov
```

## Cấu trúc thư mục

```
football-field-management
│
├── backend/
│   ├── prisma/
│   ├── src/
│   └── test/
│
├── frontend/
│
└── README.md
```

## Chức năng chính

- Quản lý loại sân
- Quản lý sân bóng
- Quản lý khung giờ
- Quản lý bảng giá
- Quản lý khách hàng
- Quản lý đặt sân
- Quản lý thanh toán
- Kiểm thử API bằng Swagger