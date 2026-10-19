package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "THONG_BAO")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThongBao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_thong_bao")
    private Long maThongBao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nguoi_nhan", nullable = false)
    private NguoiDung nguoiNhan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_nhom")
    private NhomQuy nhomQuy;

    @Column(name = "loai_thong_bao", nullable = false, length = 50)
    private String loaiThongBao;

    @Column(name = "tieu_de", nullable = false, length = 200)
    private String tieuDe;

    @Column(name = "noi_dung", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "duong_dan_lien_ket", columnDefinition = "TEXT")
    private String duongDanLienKet;

    @Column(name = "da_doc", nullable = false)
    private Boolean daDoc = false;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao = OffsetDateTime.now();

    @Column(name = "ngay_doc")
    private OffsetDateTime ngayDoc;
}