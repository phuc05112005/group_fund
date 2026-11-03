package com.groupfund.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class YeuCauRutTienRequest {
    private Long maNhom;
    private Long thuQuyId;
    private BigDecimal soTien;
    private String noiDung;
    private String tenNganHang;
    private String soTaiKhoan;
    private String tenChuTaiKhoan;
}