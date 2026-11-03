package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "\"ChiTietKhoanChi\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ChiTietKhoanChi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maChiTietKhoanChi\"")
    private Long maChiTietKhoanChi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"khoanChiId\"", nullable = false)
    private KhoanChi khoanChi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"chiTietDeXuatId\"")
    private ChiTietDeXuat chiTietDeXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nguoiNhanChiId\"", nullable = false)
    private ThanhVienNhom nguoiNhanChi;

    @Column(name = "\"soTienTru\"", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienTru;

    @Column(name = "\"trangThaiXacNhan\"", length = 30)
    private String trangThaiXacNhan = "CHO_XAC_NHAN";

    @Column(name = "\"ngayXacNhan\"")
    private OffsetDateTime ngayXacNhan;
}