package com.groupfund.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThanhVienGroupDto {
    private Long maThanhVienNhom;
    private String hoTen;
    private String email;
    private BigDecimal soDuCaNhan;
    private BigDecimal soTienDangGiu;
    private String trangThaiThanhVien;
    private List<String> danhSachVaiTro;
}