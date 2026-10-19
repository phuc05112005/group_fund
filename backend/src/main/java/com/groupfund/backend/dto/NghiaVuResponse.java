package com.groupfund.backend.dto;

import com.groupfund.backend.enums.TrangThaiNghiaVu;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class NghiaVuResponse {
    private Long maNghiaVu;
    private Long maNhom;
    private String tenNghiaVu;
    private BigDecimal soTienMacDinh;
    private OffsetDateTime hanDong;
    private String ghiChu;
    private TrangThaiNghiaVu trangThai;
    private OffsetDateTime ngayTao;
}