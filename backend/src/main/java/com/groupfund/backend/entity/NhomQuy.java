package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "NhomQuy")
@Data
public class NhomQuy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maNhom")
    private Long maNhom;

    @Column(name = "maMoi", unique = true, length = 20)
    private String maMoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoiTaoId", nullable = false)
    private NguoiDung nguoiTao;

    @Column(name = "tenNhom", nullable = false, length = 100)
    private String tenNhom;

    @Column(name = "moTa", columnDefinition = "TEXT")
    private String moTa;

    @Column(name = "loaiTienTe", length = 10)
    private String loaiTienTe = "VND";

    @Column(name = "cheDoRiengTu", length = 20)
    private String cheDoRiengTu = "RIENG_TU";

    @Column(name = "mucTieuQuy", precision = 15, scale = 2)
    private BigDecimal mucTieuQuy = BigDecimal.ZERO;

    @Column(name = "soDuQuy", precision = 15, scale = 2)
    private BigDecimal soDuQuy = BigDecimal.ZERO;

    @Column(name = "trangThai", length = 30)
    private String trangThai = "ACTIVE";

    @Column(name = "ngayTao", insertable = false, updatable = false)
    private OffsetDateTime ngayTao;
}