package com.groupfund.backend.entity;

import com.groupfund.backend.entity.id.ThanhVienVaiTroId;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "THANH_VIEN_VAI_TRO")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThanhVienVaiTro {

    @EmbeddedId
    private ThanhVienVaiTroId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maThanhVienNhom")
    @JoinColumn(name = "ma_thanh_vien_nhom")
    private ThanhVienNhom thanhVienNhom;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maVaiTro")
    @JoinColumn(name = "ma_vai_tro")
    private VaiTro vaiTro;

    @Column(name = "ngay_gan", nullable = false)
    private OffsetDateTime ngayGan = OffsetDateTime.now();
}