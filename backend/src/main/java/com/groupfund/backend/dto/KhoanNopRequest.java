package com.groupfund.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class KhoanNopRequest {
    @NotNull(message = "Mã người nộp không được để trống")
    private Long nguoiNopId;

    @NotNull(message = "Mã thủ quỹ nhận không được để trống")
    private Long thuQuyNhanId;

    @NotNull(message = "Số tiền nộp không được để trống")
    private BigDecimal soTien;

    @NotBlank(message = "Nội dung nộp tiền không được để trống")
    private String noiDung; // Thuộc tính bổ sung để khớp với CSDL KhoanNop.noiDung và UI

    private Long chiTietDeXuatId;
    private String phuongThuc = "CHUYEN_KHOAN";
    private String minhChung; // Lưu chuỗi Base64 hoặc URL ảnh minh chứng
}