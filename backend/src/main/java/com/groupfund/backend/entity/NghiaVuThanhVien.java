package com.groupfund.backend.entity;

import com.groupfund.backend.entity.id.NghiaVuThanhVienId;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "NGHIA_VU_THANH_VIEN")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NghiaVuThanhVien {

    @EmbeddedId
    private NghiaVuThanhVienId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maNghiaVu")
    @JoinColumn(name = "ma_nghia_vu")
    private NghiaVuDongGop nghiaVuDongGop;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maThanhVienNhom")
    @JoinColumn(name = "ma_thanh_vien_nhom")
    private ThanhVienNhom thanhVienNhom;

    @Column(name = "ma_nhom", nullable = false)
    private Long maNhom;

    @Column(name = "so_tien_phai_dong", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienPhaiDong;

    @Column(name = "ngay_gan", nullable = false)
    private OffsetDateTime ngayGan = OffsetDateTime.now();
}