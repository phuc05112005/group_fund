package com.groupfund.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ChuyenGiaoQuyRequest {
    private Long maNhom;
    private Long maThanhVienNhan;
    private BigDecimal soTien;
    private String ghiChu;
    private String duongDanMinhChung;
}