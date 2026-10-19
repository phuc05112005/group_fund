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
public class PhanVaiTroMultiRequest {
    private Long maThanhVienNhom;
    private List<String> danhSachVaiTro;
}