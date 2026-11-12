# Database – GroupFund

## 1. Giới thiệu

Thư mục này lưu trữ các tài nguyên liên quan đến cơ sở dữ liệu của hệ thống **GroupFund – Nền tảng quản lý quỹ nhóm minh bạch**.

Cơ sở dữ liệu sử dụng PostgreSQL. Backend được xây dựng bằng Spring Boot và sử dụng JPA/Hibernate để ánh xạ các đối tượng Java với bảng dữ liệu.

Hiện tại, cấu hình Hibernate sử dụng:

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none
```

Với cấu hình này, Hibernate không tự động tạo hoặc cập nhật cấu trúc bảng. Vì vậy, database phải được khởi tạo trước khi chạy backend.

## 2. Cấu trúc thư mục

```text
database/
├── README.md
└── group_fund_schema.sql
```

| Tệp                     | Mô tả                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- |
| `README.md`             | Tài liệu hướng dẫn cài đặt và quản lý database.                               |
| `group_fund_schema.sql` | File SQL chứa cấu trúc cơ sở dữ liệu được xuất từ database thực tế của dự án. |

**Lưu ý:** File `group_fund_schema.sql` cần được tạo và bổ sung sau khi hoàn tất việc kiểm tra cấu trúc database. Không sử dụng file SQL giả định hoặc chưa được đối chiếu với các Entity trong backend.

## 3. Yêu cầu môi trường

Trước khi khởi tạo database, cần chuẩn bị:

- PostgreSQL 16.
- PostgreSQL Client Tools (`psql`, `pg_dump`).
- Thông tin kết nối PostgreSQL.
- Source code backend GroupFund.

## 4. Tạo cơ sở dữ liệu

Đăng nhập PostgreSQL bằng tài khoản có quyền tạo database:

```bash
psql -U postgres -h localhost -p 5432
```

Tạo database:

```sql
CREATE DATABASE group_fund
    WITH ENCODING = 'UTF8';
```

Thoát khỏi PostgreSQL:

```sql
\q
```

Tên database `group_fund` là tên đề xuất trong hướng dẫn. Nếu project đang sử dụng tên khác trong cấu hình kết nối, cần thống nhất tên trước khi thực hiện.

## 5. Khởi tạo cấu trúc database

Sau khi có file `group_fund_schema.sql`, thực hiện lệnh:

```bash
psql -U postgres -h localhost -p 5432 \
    -d group_fund \
    -f group_fund_schema.sql
```

Trên Windows PowerShell:

```powershell
psql -U postgres -h localhost -p 5432 -d group_fund -f .\database\group_fund_schema.sql
```

Sau khi chạy thành công, kiểm tra danh sách bảng:

```bash
psql -U postgres -h localhost -p 5432 -d group_fund
```

Trong PostgreSQL:

```sql
\dt
```

Kiểm tra cấu trúc một bảng:

```sql
\d ten_bang
```

Tên bảng cần được thay bằng tên bảng thực tế trong database.

## 6. Xuất cấu trúc database

Khi cần cập nhật file schema từ database đang hoạt động, sử dụng `pg_dump` với tùy chọn `--schema-only`.

```bash
pg_dump -h localhost -p 5432 \
    -U postgres \
    -d group_fund \
    --schema-only \
    --no-owner \
    --no-privileges \
    -f database/group_fund_schema.sql
```

Trên Windows PowerShell:

```powershell
pg_dump -h localhost -p 5432 -U postgres -d group_fund --schema-only --no-owner --no-privileges -f .\database\group_fund_schema.sql
```

Lệnh trên chỉ xuất cấu trúc database, không xuất dữ liệu nghiệp vụ của người dùng.

Các thành phần cấu trúc có thể bao gồm:

- Tables.
- Primary Keys.
- Foreign Keys.
- Indexes.
- Sequences.
- Constraints.
- Các đối tượng schema khác được hỗ trợ bởi PostgreSQL.

Sau khi xuất, cần kiểm tra file SQL và đối chiếu với các Entity JPA trong backend trước khi cập nhật lên GitHub.

## 7. Cấu hình kết nối backend

Thông tin kết nối database được cấu hình trong:

```text
backend/src/main/resources/application.yml
```

Ví dụ cấu hình sử dụng biến môi trường:

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:postgresql://localhost:5432/group_fund}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD}

  jpa:
    hibernate:
      ddl-auto: none
```

Các giá trị kết nối phải phù hợp với môi trường thực tế.

Không đưa mật khẩu database thật vào repository. Sử dụng biến môi trường hoặc file `.env` được loại trừ khỏi Git.

## 8. Nguyên tắc quản lý database

Để đảm bảo tính nhất quán giữa database và source code, cần tuân thủ:

1. Cấu trúc database phải tương ứng với các Entity và quan hệ được định nghĩa trong backend.
2. Không tự ý thay đổi tên bảng, tên cột hoặc kiểu dữ liệu khi chưa kiểm tra ảnh hưởng đến ứng dụng.
3. Các khóa chính, khóa ngoại và ràng buộc dữ liệu phải được duy trì chính xác.
4. Không sử dụng dữ liệu cá nhân hoặc dữ liệu nhạy cảm khi xuất file schema.
5. Mọi thay đổi cấu trúc database cần được ghi nhận và cập nhật tài liệu.
6. Kiểm tra việc khởi tạo database trên một database trống trước khi phát hành phiên bản mới.

## 9. Lưu ý

- File schema phải được lấy từ database thực tế đã được kiểm tra.
- Không sử dụng `ddl-auto: create` hoặc `create-drop` trong môi trường chứa dữ liệu cần bảo toàn.
- Không commit mật khẩu, thông tin xác thực hoặc dữ liệu cá nhân lên GitHub.
- Nếu cấu trúc database thay đổi, cần cập nhật file schema và kiểm tra lại khả năng tương thích với backend.
- Đối với các phiên bản phát triển tiếp theo, có thể sử dụng Flyway hoặc Liquibase để quản lý migration và lịch sử thay đổi cấu trúc database.

---

**GroupFund – Database Documentation**

Tài liệu hướng dẫn khởi tạo và quản lý cơ sở dữ liệu của dự án GroupFund.
