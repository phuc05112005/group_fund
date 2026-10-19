package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiYeuCau;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "YEU_CAU_THAM_GIA")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class YeuCauThamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_yeu_cau")
    private Long maYeuCau;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false)
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_yeu_cau", nullable = false)
    private NguoiDung nguoiYeuCau;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_loi_moi_nguon")
    private LoiMoiThamGia loiMoiNguon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_xu_ly")
    private ThanhVienNhom nguoiXuLy;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiYeuCau trangThai = TrangThaiYeuCau.CHO_DUYET;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao = OffsetDateTime.now();

    @Column(name = "ngay_xu_ly")
    private OffsetDateTime ngayXuLy;

    @Column(name = "ly_do_xu_ly", columnDefinition = "TEXT")
    private String lyDoXuLy;
}