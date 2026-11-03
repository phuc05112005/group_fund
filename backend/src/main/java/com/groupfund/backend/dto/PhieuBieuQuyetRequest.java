package com.groupfund.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PhieuBieuQuyetRequest {
    @NotNull(message = "Mã đề xuất không được để trống")
    private Long deXuatId;

    @NotBlank(message = "Lựa chọn không được để trống")
    private String luaChon; // DONG_Y hoặc TU_CHOI
}