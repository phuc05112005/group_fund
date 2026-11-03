# SYSTEM OVERVIEW — GroupFund

> Tài liệu phản ánh mã nguồn hiện có tại thời điểm rà soát. Những mục có giao diện nhưng chỉ lưu cục bộ, hoặc API có nhưng chưa được giao diện sử dụng, được nêu rõ để không suy diễn thành chức năng hoàn chỉnh.

## 1. BỨC TRANH TOÀN CẢNH (OVERVIEW)

### Hệ thống là gì

GroupFund là ứng dụng web quản lý quỹ theo nhóm. Mỗi nhóm có mã mời, số dư quỹ chung, thành viên, người giữ tiền quỹ (thủ quỹ), đề xuất thu/chi, biểu quyết, giao dịch thu/chi, yêu cầu tham gia và thông báo. Mô hình số tiền trong code gồm ba lớp: **số dư quỹ nhóm**, **tiền thủ quỹ đang giữ**, và **số dư cá nhân của từng thành viên**.

### Tech stack và kiến trúc

- **Frontend:** React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS, Lucide; giao diện một trang (SPA), có dark/light theme lưu bằng `localStorage`.
- **Xác thực:** Keycloak JS ở frontend (bắt buộc đăng nhập, PKCE S256); backend nhận JWT Keycloak qua Spring Security OAuth2 Resource Server. Token được tự làm mới trước mỗi API call.
- **Backend:** Java 21, Spring Boot 4.1.1, Spring Web, Spring Data JPA, Bean Validation, Lombok; REST API `/api/v1`; Swagger/OpenAPI được cấu hình.
- **Dữ liệu:** PostgreSQL 16, JPA mapping trực tiếp các bảng hiện hữu (`ddl-auto: none`). Docker Compose chạy PostgreSQL và Keycloak 24; backend mặc định chạy cổng `8088`, frontend Vite thường là `5173`.
- **Tích hợp ngoài:** VNPay sandbox tạo URL thanh toán, ký/kiểm tra HMAC-SHA512 và callback; Keycloak Admin Client đồng bộ một phần hồ sơ. Ảnh QR/chứng từ được giữ dưới dạng URL hoặc Base64 trong dữ liệu ứng dụng.
- **Tổ chức:** React gọi REST API; service Spring chứa nghiệp vụ và transaction; repository JPA truy cập DB. Không thấy job/scheduler, queue, email, xuất file hay hệ thống upload file riêng.

### Dữ liệu chính

- `NguoiDung`: định danh Keycloak, hồ sơ, email/điện thoại và thông tin nhận tiền ngân hàng/QR.
- `NhomQuy`, `ThanhVienNhom`, `VaiTro`, `ThanhVienVaiTro`: nhóm, mã mời, trạng thái, thành viên, số dư cá nhân, tiền đang giữ và quyền trong nhóm.
- `DeXuat`, `ChiTietDeXuat`, `PhieuBieuQuyet`, `ChinhSachBieuQuyet`: đề xuất thu/chi, phân bổ, phiếu và chính sách biểu quyết.
- `KhoanNop`, `KhoanChi`, `ChiTietKhoanChi`, `ChuyenGiaoQuy`: dòng tiền nộp/chi, xác nhận nhận tiền và bàn giao giữa thủ quỹ.
- `YeuCauThamGia`, `ThongBao`, `NhanThongBao`: quy trình vào nhóm và hộp thư theo thành viên.

### Vai trò

- **Người đã xác thực:** mọi API trừ `/api/v1/vnpay/**`, Swagger và public API phải có JWT hợp lệ.
- **THÀNH_VIÊN:** trạng thái mặc định trên UI; không có bản ghi role hệ thống được khởi tạo cho vai trò này.
- **QUAN_TRI:** được tạo cùng chủ nhóm; code thực sự kiểm tra role này khi xem/duyệt yêu cầu vào nhóm riêng tư.
- **THU_QUY:** được tạo cùng chủ nhóm; quản lý tiền đang giữ, rút quỹ, chi và bàn giao. UI cũng dùng role này để mở các thao tác chi/rút.
- Một thành viên có thể giữ đồng thời `QUAN_TRI` và `THU_QUY`; chủ nhóm ban đầu có cả hai.

## 2. TỔNG HỢP CÁC CHỨC NĂNG (FEATURE LIST)

### Xác thực, hồ sơ và trải nghiệm chung

- Bắt buộc đăng nhập Keycloak; lần đầu vào app, frontend lấy hồ sơ nội bộ, nếu chưa có sẽ tự đồng bộ họ tên/email từ JWT vào `NguoiDung`.
- Xem/cập nhật hồ sơ: họ tên, email, điện thoại, ngân hàng, số tài khoản, tên chủ tài khoản và ảnh QR. Điện thoại được chuẩn hóa rỗng thành `null`; backend kiểm tra định dạng email/số điện thoại và giới hạn độ dài một số trường.
- Khi cập nhật, backend cố đồng bộ họ tên và email sang Keycloak; lỗi đồng bộ Keycloak chỉ được ghi log, không hủy cập nhật DB.
- Chọn ảnh QR tối đa 10 MB, crop/zoom/kéo/xoay ở trình duyệt rồi lưu Base64; có truy cập đổi mật khẩu và trang quản lý tài khoản Keycloak.
- Đăng xuất Keycloak, chuyển dark/light theme, hiệu ứng nền; không có đăng ký/đăng nhập nội bộ.

### Nhóm quỹ và thành viên

- Tạo nhóm: tên, mô tả, tiền tệ, riêng tư/công khai và mục tiêu quỹ. Hệ thống sinh mã mời duy nhất dạng `GF-XXXXXX`, số dư bằng 0, trạng thái `ACTIVE`, tạo người tạo làm thành viên và gán `QUAN_TRI` + `THU_QUY`.
- Tự khởi tạo chính sách biểu quyết nhóm: 50% đồng ý, 48 giờ hiệu lực.
- Danh sách nhóm của người dùng, tổng số dư các nhóm, tìm kiếm/lọc theo tên-mô tả/tiền tệ/trạng thái và phân trang; sao chép mã mời; xem nhóm và đề xuất cần xử lý từ dashboard.
- Vào nhóm qua mã: nhóm `CONG_KHAI` được thêm ngay; nhóm `RIENG_TU` tạo yêu cầu chờ duyệt và gửi thông báo đến từng quản trị viên.
- Quản trị viên xem và chấp nhận/từ chối yêu cầu vào nhóm riêng tư; người yêu cầu nhận thông báo kết quả.
- Xem thành viên cùng số dư cá nhân, tiền đang giữ, trạng thái và role; tìm theo tên, lọc role; xem ngân hàng/QR thành viên, sao chép số tài khoản và phóng to QR.
- Gán/bật-tắt `QUAN_TRI` hoặc `THU_QUY`, hoặc đưa về thành viên thường. API riêng cũng có gán/gỡ role.
- Cập nhật thông tin nhóm và chính sách biểu quyết; đóng nhóm (`CLOSED`); rời nhóm.

### Đề xuất và biểu quyết

- Tạo đề xuất **THU** hoặc **CHI** với tiêu đề, mục đích, tổng tiền, kiểu phân bổ, có/không biểu quyết, cờ ẩn danh và hạn biểu quyết (API hỗ trợ hạn; form hiện tại không gửi hạn).
- Các kiểu phân bổ được UI chuẩn bị: thu đều mọi thành viên, thu đều nhóm được chọn, hoặc nhập riêng từng người; chi có thể phân bổ cho nhiều người. Mỗi phân bổ là `ChiTietDeXuat` gồm thành viên, số tiền, ghi chú.
- Nếu không cần biểu quyết, đề xuất được tạo ngay trạng thái `DA_THONG_QUA`; nếu có, là `CHO_DUYET`.
- Danh sách đề xuất có tab đang hoạt động/đã hết hạn, tìm tên/nội dung, lọc thu/chi, lọc ngày, xem chi tiết phân bổ và phiếu; người tạo có thể thu hồi; thành viên bấm đồng ý/từ chối một lần.
- Từ đề xuất có thể mở form nộp VNPay (tự chọn phần phân bổ của người dùng nếu có) hoặc mở form khoản chi cho thủ quỹ.
- API có endpoint giải ngân đề xuất đã thông qua, nhưng UI hiện không gọi endpoint này.

### Thu, chi, rút và bàn giao quỹ

- **Khoản nộp:** tạo khoản nộp thủ công qua API (nội dung, phương thức, minh chứng, liên kết chi tiết đề xuất), lọc theo nhóm/trạng thái/thủ quỹ nhận, xác nhận hoặc từ chối. UI chính tạo nộp bằng VNPay, tối thiểu 10.000 VND.
- **VNPay:** tạo `KhoanNop` chờ xác nhận, tạo URL thanh toán có hạn 15 phút; trang callback kiểm tra chữ ký và kết quả, sau đó xác nhận/từ chối khoản nộp. Callback được permit-all ở backend.
- **Rút quỹ/quyết toán:** UI cho thủ quỹ rút tiền từ quỹ nhóm về ví/tài khoản cá nhân; nhập số tiền/lý do, dùng thông tin ngân hàng trong hồ sơ. Backend tạo ngay một `KhoanChi` xác nhận, giảm quỹ nhóm và tăng `soTienDangGiu` của người thực hiện, rồi thông báo nhóm.
- **Khoản chi:** thủ quỹ tạo chi cho một người nhận, phương thức, nội dung, minh chứng ảnh Base64, liên kết chi tiết đề xuất và nguồn/phân bổ chi phí: quỹ chung, chia đều nhóm chọn, hoặc số tiền riêng. Người nhận có thể xác nhận nhận tiền hoặc từ chối qua UI.
- **Bàn giao quỹ:** backend có API tạo, liệt kê và người thủ quỹ nhận xác nhận bàn giao; hỗ trợ phương thức/minh chứng. Chưa có luồng UI/API service frontend cho chức năng này.
- **Nhật ký giao dịch:** ghép khoản nộp và khoản chi từ từng nhóm, API tổng quát và fallback `localStorage`; tìm kiếm theo người/nội dung/nhóm/người nhận, lọc nhóm/thu-chi/trạng thái/ngày, phân trang, xem chi tiết và mở nhóm liên quan. Không có xuất Excel/PDF/CSV.

### Thông báo

- Backend phát thông báo nhóm đến mọi thành viên hoạt động khi tạo thông báo nhóm, thu hồi/giải ngân đề xuất, chi và rút quỹ; phát thông báo cá nhân cho quản trị viên duyệt vào nhóm và người gửi yêu cầu.
- Header tải thông báo server mỗi 20 giây, ghép với thông báo cục bộ, đếm chưa đọc, xem chi tiết, điều hướng về nhóm/đề xuất/giao dịch và đánh dấu đã đọc cục bộ.
- API server có tạo thông báo nhóm, lấy thông báo của tôi/theo thành viên và đánh dấu một thông báo đã đọc. Tuy nhiên endpoint mà UI gọi để đồng bộ “đã đọc”/“đã đọc tất cả” không trùng controller hiện có, nên trạng thái đọc server có thể không được cập nhật.

## 3. CÁC LUỒNG HOẠT ĐỘNG CHÍNH (END-TO-END FLOWS)

### 1) Đăng nhập và đồng bộ hồ sơ

1. App khởi tạo Keycloak với `login-required`; đăng nhập thành công mới render React.
2. Axios gắn Bearer token và tự refresh; `GET /nguoi-dung/me` tra theo JWT `sub`.
3. Nếu chưa có người dùng nội bộ, frontend lấy claim họ tên/email rồi `POST /nguoi-dung/sync`.
4. Hồ sơ được hiển thị; cập nhật hồ sơ lưu DB và cố cập nhật Keycloak. Giao diện báo kết quả.

### 2) Tạo nhóm và mời/vào nhóm

1. Người dùng gửi form tạo nhóm. Backend kiểm tra người tạo đã được đồng bộ từ JWT.
2. Backend lưu nhóm `ACTIVE`, sinh mã mời, tạo thành viên với mọi số dư bằng 0, gán hai role và chính sách biểu quyết mặc định.
3. Người khác nhập mã mời: mã không tồn tại hoặc đã là thành viên hoạt động sẽ bị từ chối.
4. Nhóm công khai thêm thành viên ngay; nhóm riêng tạo `CHO_DUYET`, thông báo quản trị viên. Quản trị viên duyệt/từ chối; khi duyệt thành viên chuyển/được tạo `HOAT_DONG` và nhận thông báo.

### 3) Đề xuất và biểu quyết

1. Thành viên tạo đề xuất, chọn thu/chi, tổng tiền và danh sách phân bổ; có thể bỏ qua biểu quyết.
2. Backend lưu đề xuất/phân bổ. Không biểu quyết thì `DA_THONG_QUA`; còn lại `CHO_DUYET`.
3. Mỗi lần bỏ phiếu, backend chặn đề xuất không còn chờ duyệt, quá `hanBieuQuyet` (nếu được lưu), thành viên không tồn tại và bỏ phiếu trùng.
4. Sau phiếu, backend đếm phiếu `DONG_Y` trên tổng thành viên `HOAT_DONG`; đạt ít nhất 50% thì chuyển `DA_THONG_QUA`. UI hiển thị kết quả, đồng thời có thể ghi phiếu vào `localStorage` nếu API lỗi.
5. Người tạo có thể thu hồi, trừ đề xuất đã từ chối hoặc đã giải ngân; hệ thống thông báo nhóm.

### 4) Nộp tiền qua VNPay

1. Thành viên mở nộp tiền (từ nhóm hoặc đề xuất), nhập ít nhất 10.000 VND; frontend gọi tạo thanh toán.
2. Backend tạo `KhoanNop` `CHO_XAC_NHAN`, dựng tham số VNPay, số tiền x100, thời hạn 15 phút và chữ ký HMAC-SHA512; trình duyệt chuyển đến VNPay.
3. VNPay quay lại `/payment-result`; UI chuyển query đến callback backend một lần.
4. Callback kiểm chữ ký. Mã phản hồi `00` xác nhận nộp, còn lại từ chối; UI báo thành công/thất bại.
5. Khi xác nhận, quỹ nhóm tăng, tiền thủ quỹ nhận tăng (nếu có thủ quỹ nhận) và số dư cá nhân người nộp tăng.

### 5) Rút quỹ, chi và xác nhận nhận tiền

1. Thủ quỹ yêu cầu rút số tiền dương không vượt `soDuQuy`; backend xác định người thực hiện từ JWT và chỉ kiểm tra người đó là thành viên nhóm.
2. Backend giảm quỹ nhóm, tăng tiền thủ quỹ đang giữ, tạo khoản chi `RUT_QUI` đã xác nhận và thông báo cho nhóm.
3. Thủ quỹ tạo khoản chi chỉ khi tiền đang giữ đủ. Hệ thống trừ ngay tiền đang giữ, tạo `KhoanChi`/`ChiTietKhoanChi` chờ xác nhận, trừ số dư cá nhân theo cơ chế phân bổ và phát thông báo nhóm.
4. Khi xác nhận, khoản chi và các chi tiết thành `DA_XAC_NHAN`; khi từ chối, tiền được hoàn vào tiền thủ quỹ đang giữ. UI cập nhật lịch sử/thông báo.

### 6) Bàn giao và rời nhóm

1. API bàn giao chặn người gửi và nhận trùng nhau, không tồn tại, hoặc người gửi không giữ đủ tiền; tạo giao dịch chờ xác nhận.
2. Chỉ ID thủ quỹ nhận ghi trong giao dịch có thể xác nhận. Khi xác nhận, tiền người gửi giảm, người nhận tăng; số dư quỹ nhóm không đổi.
3. Khi rời nhóm qua luồng nhóm, người dùng không được giữ tiền quỹ; role và bản ghi thành viên bị xóa. Endpoint thành viên khác dùng trạng thái `DA_ROI_NHOM` và còn chặn cả số dư cá nhân âm.

## 4. CÁC QUY TẮC NGHIỆP VỤ & LOGIC ẨN

- **Ba tầng tiền:** nộp đã xác nhận làm tăng quỹ nhóm + tiền thủ quỹ nhận (nếu có) + số dư cá nhân người nộp. Rút giảm quỹ nhưng tăng tiền thủ quỹ đang giữ. Khoản chi thường chỉ giảm tiền đang giữ, không giảm quỹ lần hai.
- **Nộp tự động:** nếu `nguoiNopId = thuQuyNhanId`, khoản nộp được xác nhận ngay. Xác nhận nộp chặn người nộp tự duyệt và, khi có thủ quỹ nhận, chỉ đúng thủ quỹ đó được duyệt.
- **Chi tối thiểu:** DTO backend yêu cầu khoản chi từ 1.000 VND; frontend tự đặt ngưỡng VNPay là 10.000 VND. Khoản nộp backend phải lớn hơn 0.
- **Phân bổ chi:** `QUY_CHUNG` chia đều mọi thành viên hoạt động; `CHIA_DEU_CHON` chia đều số tiền tổng cho danh sách chọn (bỏ qua giá trị từng dòng); `SO_TIEN_RIENG` trừ đúng từng số tiền khai báo. Code không kiểm tra tổng phân bổ riêng có bằng tổng khoản chi.
- **Biểu quyết thực tế:** backend luôn dùng ngưỡng cứng 50% số thành viên hoạt động, không sử dụng `ChinhSachBieuQuyet.tyLeDongYToiThieu`, thời hạn mặc định hay danh sách cử tri mà UI cấu hình. Phiếu từ chối không tự chuyển đề xuất sang `TU_CHOI`; chỉ khi đủ đồng ý thì đề xuất được thông qua. UI có logic hết hạn/cấu hình riêng, nên có thể khác trạng thái backend.
- **Ẩn danh:** entity/API hỗ trợ `isAnonymous` theo đề xuất, nhưng UI gửi tên trường khác và lưu cấu hình ẩn danh nhóm ở `localStorage`; backend chính sách không có cột ẩn danh. Vì vậy đây chủ yếu là cách hiển thị ở client, không phải cơ chế ẩn danh được backend bảo đảm.
- **Phân quyền:** Spring Security chỉ bắt buộc JWT cho hầu hết API. Kiểm tra role server-side rõ ràng có ở duyệt yêu cầu vào nhóm riêng và các ràng buộc theo ID ở xác nhận nộp/bàn giao/thu hồi. Nhiều API tài chính, cập nhật nhóm, đóng nhóm, gán role và tạo đề xuất nhận ID từ request nhưng không đối chiếu đầy đủ người gọi với role/nhóm; giao diện có che nút theo role nhưng đó không thay thế kiểm tra backend.
- **Không được rời/gỡ thủ quỹ khi còn tiền:** rời nhóm bị chặn nếu giữ tiền quỹ; gỡ role `THU_QUY` cũng bị chặn nếu `soTienDangGiu > 0`. Hai endpoint rời nhóm triển khai khác nhau: một xóa bản ghi, một đổi trạng thái và còn chặn nợ cá nhân.
- **Đóng nhóm:** chỉ đổi trạng thái thành `CLOSED`; code không thấy quyết toán, hoàn tiền, khóa giao dịch hay kiểm tra quyền khi đóng.
- **Dữ liệu cục bộ:** phiếu, giao dịch fallback, thông báo tự tạo, trạng thái đọc và cờ ẩn danh có thể nằm trong `localStorage`, theo trình duyệt, không phải dữ liệu dùng chung hay nguồn sự thật của backend.

