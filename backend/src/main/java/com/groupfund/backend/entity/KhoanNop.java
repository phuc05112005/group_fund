package com.groupfund.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "KhoanNop")
@Data
public class KhoanNop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "maKhoanNop")
    private Long maKhoanNop;

    @Column(name = "noiDung", columnDefinition = "TEXT")
    private String noiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nguoiNopId", nullable = false)
    @JsonIgnoreProperties({"nhomQuy", "hibernateLazyInitializer", "handler"})
    private ThanhVienNhom nguoiNop;

    // SỬA: nullable = true để cho phép nộp tiền không qua thủ quỹ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thuQuyNhanId", nullable = true)
    @JsonIgnoreProperties({"nhomQuy", "hibernateLazyInitializer", "handler"})
    private ThanhVienNhom thuQuyNhan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chiTietDeXuatId")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ChiTietDeXuat chiTietDeXuat;

    @Column(name = "soTien", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTien;

    @Column(name = "phuongThuc", length = 50)
    private String phuongThuc = "CHUYEN_KHOAN";

    @Column(name = "minhChung", columnDefinition = "TEXT")
    private String minhChung;

    @Column(name = "trangThai", length = 30)
    private String trangThai = "CHO_XAC_NHAN";

    @Column(name = "ngayKhaiBao", insertable = false, updatable = false)
    private OffsetDateTime ngayKhaiBao;
}