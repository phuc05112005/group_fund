package com.groupfund.backend.dto;

import com.groupfund.backend.enums.CheDoRiengTu;
import com.groupfund.backend.enums.TrangThaiNhom;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NhomQuyResponse {
    private Long maNhom;
    private String tenNhom;
    private String moTa;
    private String loaiTienTe;
    private CheDoRiengTu cheDoRiengTu;
    private String maThamGia;
    private BigDecimal mucTieuQuy;
    private BigDecimal soDuHienTai;
    private TrangThaiNhom trangThai;
    private OffsetDateTime ngayTao;
    private Long maNguoiTao;
    private String tenNguoiTao;
}