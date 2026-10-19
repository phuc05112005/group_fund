package com.groupfund.backend.util;

import com.groupfund.backend.entity.NguoiDung;
import com.groupfund.backend.enums.TrangThaiTaiKhoan;
import com.groupfund.backend.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final NguoiDungRepository nguoiDungRepository;

    @Transactional
    public NguoiDung getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new RuntimeException("Chưa đăng nhập hoặc Token không hợp lệ!");
        }

        String keycloakUserId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        if (name == null || name.isBlank()) {
            name = jwt.getClaimAsString("preferred_username");
        }

        final String userEmail = (email != null && !email.isBlank()) ? email : keycloakUserId + "@groupfund.local";
        final String userName = (name != null && !name.isBlank()) ? name : "NguoiDung_" + keycloakUserId.substring(0, 5);

        return nguoiDungRepository.findByKeycloakUserId(keycloakUserId)
                .orElseGet(() -> nguoiDungRepository.save(
                        NguoiDung.builder()
                                .keycloakUserId(keycloakUserId)
                                .email(userEmail)
                                .hoTen(userName)
                                .soDienThoai("0" + (System.currentTimeMillis() % 1000000000L))
                                .trangThaiTaiKhoan(TrangThaiTaiKhoan.HOAT_DONG)
                                .ngayTao(OffsetDateTime.now())
                                .ngayCapNhat(OffsetDateTime.now())
                                .build()
                ));
    }
}