package com.groupfund.backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class TaoNghiaVuRequest {
    private Long maNhom;
    private String tenNghiaVu;
    private BigDecimal soTienMacDinh;
    private OffsetDateTime hanDong;
    private String ghiChu;
}