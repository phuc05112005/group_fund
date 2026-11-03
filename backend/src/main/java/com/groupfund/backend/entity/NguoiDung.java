package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;

@Entity
@Table(name = "\"NguoiDung\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maNguoiDung\"")
    private Long maNguoiDung;

    @Column(name = "\"keycloakUserId\"", nullable = false, unique = true, length = 100)
    private String keycloakUserId;

    @Column(name = "\"hoTen\"", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "\"soDienThoai\"")
    private String soDienThoai;

    @Column(name = "\"email\"", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "\"trangThai\"", length = 30)
    private String trangThai = "ACTIVE";

    @Column(name = "\"tenNganHang\"", length = 100)
    private String tenNganHang;

    @Column(name = "\"soTaiKhoan\"", length = 50)
    private String soTaiKhoan;

    @Column(name = "\"tenChuTaiKhoan\"", length = 100)
    private String tenChuTaiKhoan;

    @Column(name = "\"qrThanhToanUrl\"", columnDefinition = "TEXT")
    private String qrThanhToanUrl;

    @Column(name = "\"ngayTao\"")
    private OffsetDateTime ngayTao;

    @Column(name = "\"ngayCapNhat\"")
    private OffsetDateTime ngayCapNhat;

    @PrePersist
    protected void onCreate() {
        this.ngayTao = OffsetDateTime.now();
        this.ngayCapNhat = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.ngayCapNhat = OffsetDateTime.now();
    }

    /**
     * Hàm sinh đường dẫn ảnh VietQR Động tự động
     */
    public String taoVietQrUrlDong(java.math.BigDecimal soTien, String noiDung) {
        if (this.tenNganHang == null || this.soTaiKhoan == null) {
            return null;
        }
        String bank = this.tenNganHang.trim();
        String stk = this.soTaiKhoan.trim();
        String name = this.tenChuTaiKhoan != null ? URLEncoder.encode(this.tenChuTaiKhoan.trim(), StandardCharsets.UTF_8) : "";
        String content = noiDung != null ? URLEncoder.encode(noiDung.trim(), StandardCharsets.UTF_8) : "";
        String amountStr = soTien != null ? soTien.toPlainString() : "0";

        return String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                bank, stk, amountStr, content, name);
    }
}