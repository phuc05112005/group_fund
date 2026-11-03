package com.groupfund.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "\"KhoanChi\"")
@Data
public class KhoanChi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maKhoanChi\"")
    private Long maKhoanChi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"thuQuyThucHienId\"", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "danhSachKhoanChi", "nhomQuy", "nguoiDung"})
    private ThanhVienNhom thuQuyThucHien;

    @Column(name = "\"soTienTong\"", nullable = false)
    private BigDecimal soTienTong;

    @Column(name = "\"loaiPhanBo\"", nullable = false)
    private String loaiPhanBo;

    @Column(name = "\"phuongThuc\"")
    private String phuongThuc = "CHUYEN_KHOAN";

    @Column(name = "\"minhChung\"", columnDefinition = "text")
    private String minhChung;

    @Column(name = "\"trangThai\"")
    private String trangThai = "CHO_XAC_NHAN";

    @Column(name = "\"ngayChi\"", nullable = false)
    private LocalDateTime ngayChi = LocalDateTime.now();

    @Column(name = "\"noiDung\"", columnDefinition = "text")
    private String noiDung;

    @OneToMany(mappedBy = "khoanChi", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties({"khoanChi", "hibernateLazyInitializer", "handler"})
    private List<ChiTietKhoanChi> danhSachChiTiet = new ArrayList<>();
}