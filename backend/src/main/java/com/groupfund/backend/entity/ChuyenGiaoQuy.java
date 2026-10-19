package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiChuyenGiao;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "CHUYEN_GIAO_QUY")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChuyenGiaoQuy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chuyen_giao")
    private Long maChuyenGiao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false)
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_chuyen", nullable = false)
    private ThanhVienNhom nguoiChuyen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_nhan", nullable = false)
    private ThanhVienNhom nguoiNhan;

    @Column(name = "so_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTien;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "duong_dan_minh_chung", columnDefinition = "TEXT")
    private String duongDanMinhChung;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiChuyenGiao trangThai = TrangThaiChuyenGiao.CHO_XAC_NHAN;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao = OffsetDateTime.now();

    @Column(name = "ngay_xac_nhan")
    private OffsetDateTime ngayXacNhan;

    @Column(name = "ly_do_tu_choi", columnDefinition = "TEXT")
    private String lyDoTuChoi;
}