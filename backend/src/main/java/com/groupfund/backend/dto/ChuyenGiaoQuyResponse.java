package com.groupfund.backend.dto;

import com.groupfund.backend.enums.TrangThaiChuyenGiao;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class ChuyenGiaoQuyResponse {
    private Long maChuyenGiao;
    private Long maNhom;
    private String tenNguoiChuyen;
    private String tenNguoiNhan;
    private BigDecimal soTien;
    private TrangThaiChuyenGiao trangThai;
    private String ghiChu;
    private String duongDanMinhChung;
    private OffsetDateTime ngayTao;
    private OffsetDateTime ngayXacNhan;
}