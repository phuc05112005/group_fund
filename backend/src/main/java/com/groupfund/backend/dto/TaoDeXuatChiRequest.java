package com.groupfund.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class TaoDeXuatChiRequest {
    private Long maNhom;
    private String tieuDe;
    private String mucDich;
    private BigDecimal soTienDeXuat;
    private String nguoiNhan;
    private Long maThuQuyDuyet;
    private String loaiHinhChi = "TAM_UNG";
    private String phuongThuc = "BANK_TRANSFER";
    private String duongDanMinhChung;
    private String ghiChu;
}