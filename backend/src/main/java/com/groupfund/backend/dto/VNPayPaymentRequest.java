package com.groupfund.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class VNPayPaymentRequest {
    @NotNull(message = "Mã người nộp không được để trống")
    private Long nguoiNopId;

    // @NotNull(message = "Mã thủ quỹ nhận không được để trống")
    private Long thuQuyNhanId;

    @NotNull(message = "Số tiền nộp không được để trống")
    private BigDecimal soTien;

    private String noiDung;
    private Long chiTietDeXuatId;
}