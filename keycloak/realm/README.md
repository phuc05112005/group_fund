# Keycloak – GroupFund Authentication

## 1. Giới thiệu

Thư mục này lưu trữ các tài nguyên cấu hình và triển khai hệ thống xác thực, phân quyền của dự án **GroupFund – Nền tảng quản lý quỹ nhóm minh bạch**.

Dự án sử dụng Keycloak làm Identity and Access Management (IAM), hỗ trợ xác thực người dùng và cung cấp thông tin định danh, vai trò cho các ứng dụng frontend và backend.

Keycloak quản lý các thành phần:

- Realm.
- Clients.
- Client scopes.
- Realm roles.
- Groups.
- Authentication flows.
- Identity providers (nếu được cấu hình).

## 2. Cấu trúc thư mục

```text
keycloak/
├── README.md
└── realm/
    └── group-fund-realm-realm.json
```

| Thành phần                    | Mô tả                                                     |
| ----------------------------- | --------------------------------------------------------- |
| `README.md`                   | Tài liệu hướng dẫn cấu hình và triển khai Keycloak.       |
| `realm/`                      | Lưu trữ các file JSON dùng để import Realm.               |
| `group-fund-realm-realm.json` | File export cấu hình Realm GroupFund từ Keycloak thực tế. |

Tên file JSON ở trên là tên dự kiến. Cần sử dụng đúng tên file được tạo từ quá trình export.

## 3. Yêu cầu môi trường

- Docker.
- Docker Compose.
- Keycloak theo phiên bản được khai báo trong `docker-compose.yml`.
- PostgreSQL được cấu hình làm database cho Keycloak.
- Các biến môi trường cần thiết để kết nối database.

## 4. Thông tin Realm

| Thuộc tính | Giá trị                            |
| ---------- | ---------------------------------- |
| Realm ID   | `group-fund-realm`                 |
| Dịch vụ    | Keycloak                           |
| Chức năng  | Xác thực và quản lý quyền truy cập |
| Cấu hình   | JSON Realm export                  |

Realm phải được thống nhất giữa file export, cấu hình backend và cấu hình frontend.

## 5. Khởi tạo Keycloak

Từ thư mục gốc project, chạy:

```bash
docker compose up -d
```

Kiểm tra trạng thái các container:

```bash
docker compose ps
```

Truy cập giao diện quản trị Keycloak:

```text
http://localhost:8080
```

Đăng nhập bằng tài khoản quản trị được cấu hình thông qua biến môi trường.

## 6. Import Realm tự động

Keycloak hỗ trợ import Realm từ thư mục:

```text
/opt/keycloak/data/import
```

Trong Docker Compose, thư mục Realm của project được ánh xạ vào đường dẫn này:

```yaml
volumes:
  - ./keycloak/realm:/opt/keycloak/data/import
```

Service Keycloak cần được khởi động với tùy chọn:

```yaml
command:
  - start-dev
  - --import-realm
```

Khi khởi động, Keycloak kiểm tra các file JSON trong thư mục import và tạo Realm chưa tồn tại theo cấu hình được cung cấp.

**Lưu ý:** Import tự động không ghi đè Realm đã tồn tại. Nếu cần cập nhật cấu hình, phải thực hiện quy trình cập nhật riêng và kiểm thử trước khi áp dụng.

## 7. Export Realm

Để cập nhật file Realm sau khi thay đổi cấu hình trên Keycloak, cần thực hiện export từ môi trường đang sử dụng.

Ví dụ với Docker Compose:

```powershell
docker compose stop keycloak

docker compose run --rm --no-deps `
  -v "${PWD}/keycloak/realm:/opt/keycloak/data/export" `
  --entrypoint /opt/keycloak/bin/kc.sh `
  keycloak export `
  --dir /opt/keycloak/data/export `
  --realm group-fund-realm `
  --users skip

docker compose up -d keycloak
```

Thay `keycloak` nếu tên service thực tế trong Docker Compose khác.

Tùy chọn `--users skip` không xuất tài khoản người dùng hiện tại. Việc này giúp tránh công khai dữ liệu cá nhân trong repository.

Sau khi export, kiểm tra file JSON và cập nhật vào Git.

## 8. Cấu hình Backend và Frontend

Các ứng dụng phải sử dụng thống nhất Realm và Client ID tương ứng.

Các thông tin cần đối chiếu:

- Keycloak server URL.
- Realm name.
- Client ID.
- Issuer URI.
- Redirect URI.
- Web origins.
- Client authentication settings.

Không giả định Client ID hoặc redirect URI nếu chưa kiểm tra cấu hình thực tế của dự án.

## 9. Bảo mật

Không đưa các thông tin sau lên repository:

- Keycloak Admin Password.
- Client Secret.
- Google Client Secret.
- Mật khẩu người dùng.
- Access Token và Refresh Token.
- Thông tin xác thực của môi trường production.

Các giá trị nhạy cảm cần được quản lý bằng biến môi trường hoặc hệ thống quản lý secret.

File Realm JSON phải được kiểm tra trước khi commit và push lên GitHub.

## 10. Kiểm thử sau khi triển khai

Sau khi khởi tạo môi trường mới, thực hiện:

1. Kiểm tra container Keycloak hoạt động.
2. Truy cập được trang quản trị Keycloak.
3. Kiểm tra Realm `group-fund-realm` đã được tạo.
4. Kiểm tra các Clients đã được import.
5. Kiểm tra Realm roles và Client scopes.
6. Kiểm tra cấu hình redirect URI.
7. Kiểm tra backend có thể xác thực với Keycloak.
8. Kiểm tra frontend có thể đăng nhập và nhận thông tin xác thực.
9. Kiểm tra quyền truy cập theo vai trò.

Chỉ xác nhận quá trình triển khai hoàn tất khi các bước kiểm thử trên đạt yêu cầu.

---

**GroupFund – Keycloak Documentation**

Tài liệu hướng dẫn cấu hình, export, import và quản lý hệ thống xác thực của dự án GroupFund.
