package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiThanhVien;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "THANH_VIEN_NHOM")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThanhVienNhom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_thanh_vien_nhom")
    private Long maThanhVienNhom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom", nullable = false)
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiDung;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_thanh_vien", nullable = false)
    private TrangThaiThanhVien trangThaiThanhVien = TrangThaiThanhVien.HOAT_DONG;

    @Column(name = "ngay_tham_gia", nullable = false)
    private OffsetDateTime ngayThamGia = OffsetDateTime.now();

    @Column(name = "ngay_roi_nhom")
    private OffsetDateTime ngayRoiNhom;
}