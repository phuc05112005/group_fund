package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "\"ThanhVienNhom\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ThanhVienNhom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maThanhVienNhom\"")
    private Long maThanhVienNhom;

    // Sửa lại tên cột khóa ngoại trỏ tới NguoiDung thành nguoiDungId
    @ManyToOne
    @JoinColumn(name = "\"nguoiDungId\"", nullable = false)
    private NguoiDung nguoiDung;

    // Sửa lại tên cột khóa ngoại trỏ tới NhomQuy thành nhomId
    @ManyToOne
    @JoinColumn(name = "\"nhomId\"", nullable = false)
    private NhomQuy nhomQuy;

    @Column(name = "\"soDuCaNhan\"")
    private BigDecimal soDuCaNhan = BigDecimal.ZERO;

    @Column(name = "\"soTienDangGiu\"")
    private BigDecimal soTienDangGiu = BigDecimal.ZERO;

    @Column(name = "\"trangThaiThanhVien\"")
    private String trangThaiThanhVien = "HOAT_DONG";

    // Danh sách các vai trò của thành viên trong nhóm
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "\"ThanhVienNhom_VaiTro\"",
            joinColumns = @JoinColumn(name = "\"maThanhVienNhom\"")
    )
    @Column(name = "\"tenVaiTro\"")
    private List<String> danhSachVaiTro = new ArrayList<>();
}