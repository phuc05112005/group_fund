package com.groupfund.backend.dto;

import com.groupfund.backend.enums.TrangThaiKhoanNop;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class KhoanNopResponse {
    private Long maKhoanNop;
    private Long maNhom;
    private String tenNguoiKhaiBao;
    private String tenThuQuyNhan;
    private Long maNghiaVu;
    private BigDecimal soTien;
    private String phuongThuc;
    private String duongDanMinhChung;
    private String ghiChu;
    private TrangThaiKhoanNop trangThai;
    private OffsetDateTime ngayKhaiBao;
    private OffsetDateTime ngayXacNhan;
    private String lyDoTuChoi;
}