package com.groupfund.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class KhaiBaoKhoanNopRequest {
    private Long maNhom;
    private Long maNghiaVu;
    private String noiDung;
    private BigDecimal soTien;
    private Long maThuQuyNhan;
    private String phuongThuc = "BANK_TRANSFER";
    private String duongDanMinhChung;
    private String ghiChu;
}