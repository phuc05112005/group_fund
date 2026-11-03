package com.groupfund.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ChuyenGiaoQuyRequest {
    @NotNull(message = "Mã thủ quỹ gửi không được để trống")
    private Long thuQuyGuiId;

    @NotNull(message = "Mã thủ quỹ nhận không được để trống")
    private Long thuQuyNhanId;

    @NotNull(message = "Số tiền bàn giao không được để trống")
    private BigDecimal soTien;

    private String phuongThuc = "CHUYEN_KHOAN";
    private String minhChung;
}