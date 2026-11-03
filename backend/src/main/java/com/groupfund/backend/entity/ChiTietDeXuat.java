package com.groupfund.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "\"ChiTietDeXuat\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ChiTietDeXuat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maChiTietDeXuat\"")
    private Long maChiTietDeXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"deXuatId\"", nullable = false)
    @JsonIgnoreProperties({"chiTietList", "hibernateLazyInitializer", "handler"})
    private DeXuat deXuat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"thanhVienId\"", nullable = false)
    @JsonIgnoreProperties({"nhomQuy", "hibernateLazyInitializer", "handler"})
    private ThanhVienNhom thanhVienNhom;

    @Column(name = "\"soTienPhanBo\"", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienPhanBo;

    @Column(name = "\"ghiChu\"", columnDefinition = "TEXT")
    private String ghiChu;
}