package com.groupfund.backend.entity;

import com.groupfund.backend.entity.id.ChinhSachNguoiBieuQuyetId;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "CHINH_SACH_NGUOI_BIEU_QUYET")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChinhSachNguoiBieuQuyet {

    @EmbeddedId
    private ChinhSachNguoiBieuQuyetId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maChinhSach")
    @JoinColumn(name = "ma_chinh_sach")
    private ChinhSachPheDuyet chinhSachPheDuyet;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maThanhVienNhom")
    @JoinColumn(name = "ma_thanh_vien_nhom")
    private ThanhVienNhom thanhVienNhom;

    @Column(name = "ma_nhom", nullable = false)
    private Long maNhom;

    @Column(name = "ngay_chi_dinh", nullable = false)
    private OffsetDateTime ngayChiDinh = OffsetDateTime.now();
}