package com.groupfund.backend.entity;

import com.groupfund.backend.enums.LuaChonBieuQuyet;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "PHIEU_BIEU_QUYET")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PhieuBieuQuyet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_phieu")
    private Long maPhieu;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_de_xuat", nullable = false)
    private DeXuatChi deXuatChi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_thanh_vien_nhom", nullable = false)
    private ThanhVienNhom thanhVienNhom;

    @Enumerated(EnumType.STRING)
    @Column(name = "lua_chon", nullable = false, length = 20)
    private LuaChonBieuQuyet luaChon;

    @Column(name = "ngay_bieu_quyet", nullable = false)
    private OffsetDateTime ngayBieuQuyet = OffsetDateTime.now();

    @Column(name = "ngay_cap_nhat")
    private OffsetDateTime ngayCapNhat;
}