package com.groupfund.backend.entity;

import com.groupfund.backend.enums.CheDoRiengTu;
import com.groupfund.backend.enums.TrangThaiNhom;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "NHOM_QUY")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NhomQuy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nhom")
    private Long maNhom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_tao", nullable = false)
    private NguoiDung nguoiTao;

    @Column(name = "ten_nhom", nullable = false, length = 100)
    private String tenNhom;

    @Column(name = "mo_ta", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "loai_tien_te", nullable = false, length = 10)
    private String loaiTienTe;

    @Enumerated(EnumType.STRING)
    @Column(name = "che_do_rieng_tu", nullable = false)
    private CheDoRiengTu cheDoRiengTu;

    @Column(name = "ma_tham_gia", length = 20, unique = true)
    private String maThamGia;

    @Column(name = "muc_tieu_quy", precision = 15, scale = 2)
    private BigDecimal mucTieuQuy;

    @Column(name = "so_du_hien_tai", precision = 15, scale = 2)
    private BigDecimal soDuHienTai;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai", nullable = false)
    private TrangThaiNhom trangThai;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao;

    @Column(name = "ngay_dong")
    private OffsetDateTime ngayDong;
}