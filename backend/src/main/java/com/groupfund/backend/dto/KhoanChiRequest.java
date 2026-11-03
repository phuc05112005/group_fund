package com.groupfund.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class KhoanChiRequest {

    @NotNull(message = "Mã nhóm không được để trống")
    private Long maNhom;

    @NotNull(message = "Mã thủ quỹ thực hiện không được để trống")
    private Long thuQuyThucHienId;

    @NotNull(message = "Mã người nhận chi không được để trống")
    private Long nguoiNhanChiId;

    @NotNull(message = "Số tiền chi không được để trống")
    @DecimalMin(value = "1000.00", message = "Số tiền chi tối thiểu là 1,000 VND")
    @JsonAlias({"soTien", "soTienTong"})
    private BigDecimal soTien;

    @NotBlank(message = "Loại phân bổ không được để trống")
    private String loaiPhanBo; // QUY_CHUNG | CHIA_DEU_CHON | SO_TIEN_RIENG

    private String phuongThuc = "CHUYEN_KHOAN";
    private String minhChung;

    @NotBlank(message = "Nội dung chi không được để trống")
    private String noiDung;

    private Long chiTietDeXuatId;

    @Valid
    private List<PhanBoCaNhanDto> dsPhanBo;

    @Data
    public static class PhanBoCaNhanDto {
        @NotNull(message = "Mã thành viên phân bổ không được để trống")
        private Long thanhVienId;

        @DecimalMin(value = "0.00", message = "Số tiền trừ không được âm")
        private BigDecimal soTienTru;
    }
}