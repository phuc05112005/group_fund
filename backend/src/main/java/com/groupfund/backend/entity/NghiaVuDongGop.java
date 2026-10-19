package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiNghiaVu;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "NGHIA_VU_DONG_GOP")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NghiaVuDongGop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nghia_vu")
    private Long maNghiaVu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false)
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_tao", nullable = false)
    private ThanhVienNhom nguoiTao;

    @Column(name = "ten_nghia_vu", nullable = false, length = 150)
    private String tenNghiaVu;

    @Column(name = "so_tien_mac_dinh", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienMacDinh;

    @Column(name = "han_dong")
    private OffsetDateTime hanDong;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiNghiaVu trangThai = TrangThaiNghiaVu.HOAT_DONG;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao = OffsetDateTime.now();
}