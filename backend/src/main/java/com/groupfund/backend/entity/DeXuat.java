package com.groupfund.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Entity
@Table(name = "\"DeXuat\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class DeXuat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maDeXuat\"")
    private Long maDeXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nhomId\"", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private NhomQuy nhomQuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nguoiTaoId\"", nullable = false)
    @JsonIgnoreProperties({"nhomQuy", "hibernateLazyInitializer", "handler"})
    private ThanhVienNhom nguoiTao;

    @Column(name = "\"tieuDe\"", nullable = false, length = 200)
    private String tieuDe;

    @Column(name = "\"mucDich\"", columnDefinition = "TEXT")
    private String mucDich;

    @Column(name = "\"loaiDeXuat\"", nullable = false, length = 50)
    private String loaiDeXuat;

    @Column(name = "\"kieuPhanBo\"", nullable = false, length = 50)
    private String kieuPhanBo;

    @Column(name = "\"soTienTong\"", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienTong;

    @Column(name = "\"coBieuQuyet\"")
    private Boolean coBieuQuyet = true;

    // [BỔ SUNG 1] Cấu hình ẩn danh biểu quyết cho riêng đề xuất này
    @Column(name = "\"isAnonymous\"")
    private Boolean isAnonymous = false;

    // [BỔ SUNG 2] Thời hạn biểu quyết đặt trực tiếp khi tạo đề xuất
    @Column(name = "\"hanBieuQuyet\"")
    private OffsetDateTime hanBieuQuyet;

    @Column(name = "\"trangThai\"", length = 30)
    private String trangThai = "CHO_DUYET";

    @Column(name = "\"ngayTao\"", insertable = false, updatable = false)
    private OffsetDateTime ngayTao;

    // [BỔ SUNG 3] Sửa lỗi thiếu chiTietList trả về Frontend
    @OneToMany(mappedBy = "deXuat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"deXuat", "hibernateLazyInitializer", "handler"})
    private List<ChiTietDeXuat> chiTietList;
}