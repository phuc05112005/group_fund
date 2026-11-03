package com.groupfund.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class DeXuatRequest {
    @NotNull(message = "Mã nhóm không được để trống")
    private Long nhomId;

    private Long maThanhVienTao;

    @NotBlank(message = "Tiêu đề không được để trống")
    private String tieuDe;

    private String mucDich;

    @NotBlank(message = "Loại đề xuất không được để trống")
    private String loaiDeXuat;

    @NotBlank(message = "Kiểu phân bổ không được để trống")
    private String kieuPhanBo;

    @NotNull(message = "Tổng số tiền không được để trống")
    private BigDecimal soTienTong;

    private Boolean coBieuQuyet = true;

    // [BỔ SUNG]
    private Boolean isAnonymous = false;

    // [BỔ SUNG]
    private OffsetDateTime hanBieuQuyet;

    @JsonAlias({"chiTietList", "chiTietItems"})
    private List<ChiTietDeXuatItem> chiTietItems;

    @Data
    public static class ChiTietDeXuatItem {
        @NotNull(message = "Mã thành viên nhận không được để trống")
        private Long thanhVienId;
        @NotNull(message = "Số tiền phân bổ không được để trống")
        private BigDecimal soTienPhanBo;
        private String ghiChu;
    }
}