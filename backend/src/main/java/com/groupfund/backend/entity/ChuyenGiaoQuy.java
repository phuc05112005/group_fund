package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "\"ChuyenGiaoQuy\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ChuyenGiaoQuy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maChuyenGiao\"")
    private Long maChuyenGiao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"thuQuyGuiId\"", nullable = false)
    private ThanhVienNhom thuQuyGui;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"thuQuyNhanId\"", nullable = false)
    private ThanhVienNhom thuQuyNhan;

    @Column(name = "\"soTien\"", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTien;

    @Column(name = "\"phuongThuc\"", length = 50)
    private String phuongThuc = "CHUYEN_KHOAN";

    @Column(name = "minh_chung", columnDefinition = "text")
    private String minhChung;

    @Column(name = "\"trangThai\"", length = 30)
    private String trangThai = "CHO_XAC_NHAN";

    @Column(name = "\"ngayTao\"", insertable = false, updatable = false)
    private OffsetDateTime ngayTao;
}