package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "KHOAN_CHI")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KhoanChi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_khoan_chi")
    private Long maKhoanChi;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_de_xuat", nullable = false, unique = true)
    private DeXuatChi deXuatChi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false)
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_thu_quy_thuc_hien", nullable = false)
    private ThanhVienNhom thuQuyThucHien;

    @Column(name = "so_tien_thuc_chi", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienThucChi;

    @Column(name = "phuong_thuc", nullable = false, length = 50)
    private String phuongThuc = "BANK_TRANSFER";

    @Column(name = "duong_dan_minh_chung", columnDefinition = "TEXT")
    private String duongDanMinhChung;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ngay_chi", nullable = false)
    private OffsetDateTime ngayChi = OffsetDateTime.now();

    @Column(name = "ngay_ghi_nhan", nullable = false)
    private OffsetDateTime ngayGhiNhan = OffsetDateTime.now();
}