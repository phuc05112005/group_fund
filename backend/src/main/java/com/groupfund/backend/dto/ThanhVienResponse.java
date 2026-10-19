package com.groupfund.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThanhVienResponse {
    private Long maThanhVienNhom;
    private Long maNguoiDung;
    private String tenNguoiDung;
    private String hoTen;
    private String tenVaiTro;
    private List<String> danhSachVaiTro;
}