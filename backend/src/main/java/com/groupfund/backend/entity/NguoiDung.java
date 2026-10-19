package com.groupfund.backend.entity;

import com.groupfund.backend.enums.TrangThaiTaiKhoan;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "NGUOI_DUNG")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NguoiDung {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nguoi_dung")
    private Long maNguoiDung;

    @Column(name = "keycloak_user_id", nullable = false, unique = true, length = 100)
    private String keycloakUserId;

    @Column(name = "ho_ten", nullable = false, length = 100)
    private String hoTen;

    @Column(name = "so_dien_thoai", nullable = false, unique = true, length = 20)
    private String soDienThoai;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "trang_thai_tai_khoan", nullable = false)
    private TrangThaiTaiKhoan trangThaiTaiKhoan = TrangThaiTaiKhoan.HOAT_DONG;

    @Column(name = "ngay_tao", nullable = false)
    private OffsetDateTime ngayTao = OffsetDateTime.now();

    @Column(name = "ngay_cap_nhat", nullable = false)
    private OffsetDateTime ngayCapNhat = OffsetDateTime.now();
}