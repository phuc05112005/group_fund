package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "CHINH_SACH_PHE_DUYET")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChinhSachPheDuyet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chinh_sach")
    private Long maChinhSach;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false, unique = true)
    private NhomQuy nhomQuy;

    @Column(name = "bat_phe_duyet", nullable = false)
    private Boolean batPheDuyet = true;

    @Column(name = "bat_bieu_quyet", nullable = false)
    private Boolean batBieuQuyet = false;

    @Column(name = "pham_vi_bieu_quyet", nullable = false, length = 50)
    private String phamViBieuQuyet = "ALL_MEMBERS";

    @Column(name = "thoi_han_bieu_quyet_gio", nullable = false)
    private Integer thoiHanBieuQuyetGio = 24;

    @Column(name = "ngay_cap_nhat", nullable = false)
    private OffsetDateTime ngayCapNhat = OffsetDateTime.now();
}