package com.groupfund.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    private String hoTen;

    @Pattern(
            regexp = "^$|^(0|\\+84)[0-9]{9}$",
            message = "Số điện thoại không hợp lệ (phải đủ 10 chữ số)"
    )
    private String soDienThoai;

    @Email(message = "Email không đúng định dạng")
    private String email;

    @Size(max = 100, message = "Tên ngân hàng không vượt quá 100 ký tự")
    private String tenNganHang;

    @Size(max = 50, message = "Số tài khoản không vượt quá 50 ký tự")
    private String soTaiKhoan;

    @Size(max = 100, message = "Tên chủ tài khoản không vượt quá 100 ký tự")
    private String tenChuTaiKhoan;

    private String qrThanhToanUrl;
}