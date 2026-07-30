# User Guide

# Football Field Management System

## 1. Giới thiệu

Football Field Management System là hệ thống hỗ trợ quản lý sân bóng đá dành cho quản trị viên. Hệ thống giúp quản lý loại sân, sân bóng, khung giờ, bảng giá, khách hàng, đặt sân và thanh toán.

---

# 2. Truy cập hệ thống

Sau khi khởi động Backend và Frontend thành công:

- Frontend: http://localhost:3000
- Swagger API: http://localhost:3001/api

Người quản trị truy cập giao diện để thực hiện các chức năng quản lý.

---

# 3. Quản lý loại sân

Chức năng cho phép:

- Xem danh sách loại sân
- Thêm loại sân mới
- Chỉnh sửa thông tin loại sân
- Xóa loại sân

Ví dụ:

- Sân 5 người
- Sân 7 người
- Sân 11 người

---

# 4. Quản lý sân bóng

Người quản trị có thể:

- Thêm sân mới
- Cập nhật thông tin sân
- Xóa sân
- Thay đổi trạng thái hoạt động

Thông tin gồm:

- Mã sân
- Tên sân
- Loại sân
- Hình ảnh
- Mô tả
- Trạng thái

---

# 5. Quản lý khung giờ

Hệ thống hỗ trợ:

- Thêm khung giờ
- Sửa khung giờ
- Xóa khung giờ

Ví dụ:

- 06:00 - 07:30
- 07:30 - 09:00
- 17:00 - 18:30

---

# 6. Quản lý bảng giá

Quản trị viên có thể:

- Thiết lập giá theo từng sân
- Thiết lập giá theo từng khung giờ
- Chỉnh sửa bảng giá

Ví dụ:

| Khung giờ | Giá |
|-----------|------------|
| Sáng | 250.000 VNĐ |
| Chiều | 350.000 VNĐ |
| Tối | 500.000 VNĐ |

---

# 7. Quản lý khách hàng

Bao gồm:

- Thêm khách hàng
- Cập nhật thông tin
- Xóa khách hàng
- Tra cứu khách hàng

Thông tin quản lý:

- Họ tên
- Số điện thoại
- Email
- Địa chỉ

---

# 8. Quản lý đặt sân

Người quản trị có thể:

- Tạo đơn đặt sân
- Chọn khách hàng
- Chọn sân
- Chọn ngày chơi
- Chọn khung giờ
- Xem trạng thái đơn

---

# 9. Quản lý thanh toán

Hệ thống hỗ trợ:

- Ghi nhận thanh toán
- Cập nhật trạng thái thanh toán
- Quản lý hình thức thanh toán

Các hình thức:

- Tiền mặt
- Chuyển khoản
- Ví điện tử

---

# 10. Kiểm thử API

Backend tích hợp Swagger.

Các API có thể kiểm thử:

- Field Types
- Fields
- Time Slots
- Field Prices
- Customers
- Bookings
- Payments

Swagger giúp kiểm tra dữ liệu đầu vào, dữ liệu đầu ra và các trường hợp lỗi.

---

# 11. Kết luận

Football Field Management System giúp quản lý toàn bộ hoạt động của sân bóng một cách thuận tiện, giảm thao tác thủ công, nâng cao hiệu quả quản lý và hỗ trợ vận hành hệ thống.