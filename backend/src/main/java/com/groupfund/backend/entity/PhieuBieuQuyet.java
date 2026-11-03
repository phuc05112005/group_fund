package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "\"PhieuBieuQuyet\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PhieuBieuQuyet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maPhieu\"")
    private Long maPhieu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"deXuatId\"", nullable = false)
    private DeXuat deXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"thanhVienId\"", nullable = false)
    private ThanhVienNhom thanhVienNhom;

    @Column(name = "\"luaChon\"", nullable = false, length = 20)
    private String luaChon;

    @Column(name = "\"ngayBieuQuyet\"", insertable = false, updatable = false)
    private OffsetDateTime ngayBieuQuyet;
}