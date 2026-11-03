package com.groupfund.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ThanhVienVaiTroRequest {
    @NotNull(message = "Mã thành viên nhóm không được để trống")
    private Long thanhVienId;

    @NotBlank(message = "Tên vai trò không được để trống")
    private String tenVaiTro; // QUAN_TRI, THU_QUY
}