package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiDeXuat;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "DE_XUAT_CHI")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeXuatChi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_de_xuat")
    private Long maDeXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false)
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_tao", nullable = false)
    private ThanhVienNhom nguoiTao;

    @Column(name = "tieu_de", nullable = false, length = 200)
    private String tieuDe;

    @Column(name = "muc_dich", nullable = false, columnDefinition = "TEXT")
    private String mucDich;

    @Column(name = "so_tien_de_xuat", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienDeXuat;

    @Column(name = "nguoi_nhan", nullable = false, length = 150)
    private String nguoiNhan;

    @Column(name = "duong_dan_minh_chung", columnDefinition = "TEXT")
    private String duongDanMinhChung;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiDeXuat trangThai = TrangThaiDeXuat.CHO_DUYET;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao = OffsetDateTime.now();

    @Column(name = "ngay_gui")
    private OffsetDateTime ngayGui;

    @Column(name = "can_phe_duyet")
    private Boolean canPheDuyet;

    @Column(name = "pham_vi_bieu_quyet_ap_dung", length = 50)
    private String phamViBieuQuyetApDung;

    @Column(name = "kieu_dieu_kien_ap_dung", length = 20)
    private String kieuDieuKienApDung;

    @Column(name = "so_nguoi_dong_y_toi_thieu_ap_dung")
    private Integer soNguoiDongYToiThieuApDung;

    @Column(name = "ty_le_dong_y_toi_thieu_ap_dung", precision = 5, scale = 2)
    private BigDecimal tyLeDongYToiThieuApDung;

    @Column(name = "han_bieu_quyet")
    private OffsetDateTime hanBieuQuyet;
}