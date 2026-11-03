package com.groupfund.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class NhomQuyRequest {
    @NotBlank(message = "Tên nhóm không được để trống")
    private String tenNhom;
    private String moTa;
    private String loaiTienTe = "VND";
    private String cheDoRiengTu = "RIENG_TU";
    private BigDecimal mucTieuQuy;
}