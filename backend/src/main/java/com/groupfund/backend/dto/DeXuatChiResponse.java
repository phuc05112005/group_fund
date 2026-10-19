package com.groupfund.backend.dto;

import com.groupfund.backend.enums.TrangThaiDeXuat;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class DeXuatChiResponse {
    private Long maDeXuat;
    private Long maNhom;
    private String tenNguoiTao;
    private String tieuDe;
    private String mucDich;
    private BigDecimal soTienDeXuat;
    private String nguoiNhan;
    private String duongDanMinhChung;
    private String ghiChu;
    private TrangThaiDeXuat trangThai;
    private OffsetDateTime ngayTao;
    private OffsetDateTime hanBieuQuyet;
    private long soPhieuDongY;
    private long soPhieuKhongDongY;
}