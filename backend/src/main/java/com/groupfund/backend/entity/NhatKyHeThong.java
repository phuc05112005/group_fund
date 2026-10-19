package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "NHAT_KY_HE_THONG")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NhatKyHeThong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nhat_ky")
    private Long maNhatKy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_thuc_hien")
    private NguoiDung nguoiThucHien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom")
    private NhomQuy nhomQuy;

    @Column(name = "hanh_dong", nullable = false, length = 100)
    private String hanhDong;

    @Column(name = "loai_doi_tuong", nullable = false, length = 50)
    private String loaiDoiTuong;

    @Column(name = "ma_doi_tuong", nullable = false, length = 50)
    private String maDoiTuong;

    @Column(name = "du_lieu_cu", columnDefinition = "jsonb")
    private String duLieuCu;

    @Column(name = "du_lieu_moi", columnDefinition = "jsonb")
    private String duLieuMoi;

    @Column(name = "ly_do", columnDefinition = "TEXT")
    private String lyDo;

    @Column(name = "thoi_diem", nullable = false)
    private OffsetDateTime thoiDiem = OffsetDateTime.now();
}