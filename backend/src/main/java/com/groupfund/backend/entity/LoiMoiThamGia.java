package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiLoiMoi;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "LOI_MOI_THAM_GIA")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoiMoiThamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_loi_moi")
    private Long maLoiMoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_thanh_vien_gui_loi_moi", nullable = false)
    private ThanhVienNhom thanhVienGuiLoiMoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_duoc_moi", nullable = false)
    private NguoiDung nguoiDuocMoi;

    @Column(name = "cach_xu_ly_khi_chap_nhan", nullable = false, length = 50)
    private String cachXuLyKhiChapNhan = "AUTO_ACCEPT";

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiLoiMoi trangThai = TrangThaiLoiMoi.CHO_XAC_NHAN;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao = OffsetDateTime.now();

    @Column(name = "ngay_phan_hoi")
    private OffsetDateTime ngayPhanHoi;

    @Column(name = "het_han_luc")
    private OffsetDateTime hetHanLuc;
}