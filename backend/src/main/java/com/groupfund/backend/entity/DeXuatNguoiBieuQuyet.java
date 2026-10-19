package com.groupfund.backend.entity;

import com.groupfund.backend.entity.id.DeXuatNguoiBieuQuyetId;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "DE_XUAT_NGUOI_BIEU_QUYET")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeXuatNguoiBieuQuyet {

    @EmbeddedId
    private DeXuatNguoiBieuQuyetId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maDeXuat")
    @JoinColumn(name = "ma_de_xuat")
    private DeXuatChi deXuatChi;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maThanhVienNhom")
    @JoinColumn(name = "ma_thanh_vien_nhom")
    private ThanhVienNhom thanhVienNhom;

    @Column(name = "ma_nhom", nullable = false)
    private Long maNhom;

    @Column(name = "ngay_chot", nullable = false)
    private OffsetDateTime ngayChot = OffsetDateTime.now();
}