# KẾT QUẢ KIỂM THỬ API

## Thông tin kiểm thử

- Người thực hiện: Luật
- Công cụ: Swagger UI
- Backend: NestJS
- ORM: Prisma
- Database: MySQL
- Địa chỉ API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs
- Ngày kiểm thử: 28/07/2026

## Quy ước

- PASS: API hoạt động đúng
- FAIL: API hoạt động sai hoặc phát sinh lỗi
- BLOCKED: Chưa thể kiểm thử

## Kết quả kiểm thử
| Mã | API | Phương thức | Trường hợp kiểm thử | Kết quả mong đợi | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|---|
| FT-01 | /field-types | POST | Tạo loại sân hợp lệ | Tạo thành công | API trả 201, tạo loại sân ID=1 | PASS |
| FT-02 | /field-types | GET | Lấy danh sách loại sân | Trả về danh sách | API trả 200, danh sách có loại sân ID=1 | PASS |
| FT-03 | /field-types/{id} | GET | Lấy loại sân theo ID | Trả về đúng dữ liệu | API trả 200 với ID=1 | PASS |
| FT-04 | /field-types/{id} | PATCH | Cập nhật loại sân | Cập nhật thành công | API trả 200, cập nhật mô tả thành công | PASS |
| FT-05 | /field-types/{id} | GET | ID không tồn tại | Trả về 404 | API trả 404, thông báo "Không tìm thấy loại sân" | PASS |
| TS-01 | /time-slots | POST | Tạo khung giờ hợp lệ | Tạo thành công | API trả 201, tạo khung giờ thành công | PASS |
| TS-02 | /time-slots | GET | Lấy danh sách khung giờ | Trả về danh sách | API trả 200, danh sách có khung giờ | PASS |
| TS-03 | /time-slots/{id} | GET | Lấy khung giờ theo ID | Trả về đúng dữ liệu | API trả 200 với ID hợp lệ | PASS |
| TS-04 | /time-slots/{id} | PATCH | Cập nhật khung giờ | Cập nhật thành công | API trả 200, cập nhật thành công | PASS |
| TS-05 | /time-slots/{id} | GET | ID không tồn tại | Trả về 404 | API trả 404, thông báo "Không tìm thấy khung giờ" | PASS |

| F-01 | /fields | POST | Tạo sân hợp lệ | Tạo thành công | API trả 201, tạo sân thành công | PASS |
| F-02 | /fields | GET | Lấy danh sách sân | Trả về danh sách | API trả 200, trả về danh sách sân | PASS |
| F-03 | /fields/{id} | GET | Lấy sân theo ID | Trả về đúng dữ liệu | API trả 200 với ID hợp lệ | PASS |
| F-04 | /fields/{id} | PATCH | Cập nhật sân | Cập nhật thành công | API trả 200, cập nhật thành công | PASS |
| F-05 | /fields/{id} | GET | ID không tồn tại | Trả về 404 | API trả 404, thông báo không tìm thấy sân | PASS |

| FP-01 | /field-prices | POST | Tạo giá sân hợp lệ | Tạo thành công | API trả 201, tạo giá sân thành công | PASS |
| FP-02 | /field-prices | GET | Lấy danh sách giá sân | Trả về danh sách | API trả 200, trả về danh sách giá sân | PASS |
| FP-03 | /field-prices/{id} | GET | Lấy giá sân theo ID | Trả về đúng dữ liệu | API trả 200 với ID hợp lệ | PASS |
| FP-04 | /field-prices/{id} | PATCH | Cập nhật giá sân | Cập nhật thành công | API trả 200, cập nhật thành công | PASS |
| FP-05 | /field-prices/{id} | GET | ID không tồn tại | Trả về 404 | API trả 404, thông báo không tìm thấy giá sân | PASS |

| C-01 | /customers | POST | Tạo khách hàng hợp lệ | Tạo thành công | API trả 201, tạo khách hàng thành công | PASS |
| C-02 | /customers | GET | Lấy danh sách khách hàng | Trả về danh sách | API trả 200, trả về danh sách khách hàng theo từ khóa tìm kiếm | PASS |
| C-03 | /customers/{id} | GET | Lấy khách hàng theo ID | Trả về đúng dữ liệu | API trả 200 với ID hợp lệ | PASS |
| C-04 | /customers/{id} | PATCH | Cập nhật khách hàng | Cập nhật thành công | API trả 200, cập nhật thành công | PASS |
| C-05 | /customers/{id} | GET | ID không tồn tại | Trả về 404 | API trả 404, thông báo không tìm thấy khách hàng | PASS |

| B-01 | /bookings | POST | Tạo đơn đặt sân hợp lệ | Tạo thành công | API trả 201, tạo đơn đặt sân thành công | PASS |
| B-02 | /bookings | GET | Lấy danh sách đơn đặt sân | Trả về danh sách | API trả 200, trả về danh sách theo điều kiện lọc | PASS |
| B-03 | /bookings/{id} | GET | Lấy đơn đặt sân theo ID | Trả về đúng dữ liệu | API trả 200 với ID hợp lệ | PASS |
| B-04 | /bookings/{id} | PATCH | Cập nhật trạng thái đơn đặt sân | Cập nhật thành công | API trả 200, cập nhật trạng thái thành công | PASS |
| B-05 | /bookings/{id} | GET | ID không tồn tại | Trả về 404 | API trả 404, thông báo không tìm thấy đơn đặt sân | PASS |

| P-01 | /payments | POST | Tạo thanh toán hợp lệ | Tạo thành công | API trả 201, tạo thanh toán thành công | PASS |
| P-02 | /payments | GET | Lấy danh sách thanh toán | Trả về danh sách | API trả 200, trả về danh sách thanh toán | PASS |
| P-03 | /payments/{id} | GET | Lấy thanh toán theo ID | Trả về đúng dữ liệu | API trả 200 với ID hợp lệ | PASS |
| P-04 | /payments/{id} | DELETE | Xóa thanh toán | Xóa thành công | API trả 200/204, xóa thành công | PASS |
| P-05 | /payments/{id} | GET | ID không tồn tại | Trả về 404 | API trả 404, thông báo không tìm thấy thanh toán | PASS |

| APP-01 | / | GET | Kiểm tra API hoạt động | Trả về thông báo thành công | API trả 200, server hoạt động bình thường | PASS |