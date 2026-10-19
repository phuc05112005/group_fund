package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiKhoanNop;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "KHOAN_NOP")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KhoanNop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_khoan_nop")
    private Long maKhoanNop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false)
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_khai_bao", nullable = false)
    private ThanhVienNhom nguoiKhaiBao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_thu_quy_nhan", nullable = false)
    private ThanhVienNhom thuQuyNhan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nghia_vu")
    private NghiaVuDongGop nghiaVuDongGop;

    @Column(name = "so_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTien;

    @Column(name = "so_tien_ap_dung_nghia_vu", precision = 15, scale = 2)
    private BigDecimal soTienApDungNghiaVu = BigDecimal.ZERO;

    @Column(name = "phuong_thuc", nullable = false, length = 50)
    private String phuongThuc = "BANK_TRANSFER";

    @Column(name = "duong_dan_minh_chung", columnDefinition = "TEXT")
    private String duongDanMinhChung;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiKhoanNop trangThai = TrangThaiKhoanNop.CHO_XAC_NHAN;

    @Column(name = "ngay_khai_bao", nullable = false)
    private OffsetDateTime ngayKhaiBao = OffsetDateTime.now();

    @Column(name = "ngay_xac_nhan")
    private OffsetDateTime ngayXacNhan;

    @Column(name = "ly_do_tu_choi", columnDefinition = "TEXT")
    private String lyDoTuChoi;
}