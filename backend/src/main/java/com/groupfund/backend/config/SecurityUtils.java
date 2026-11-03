package com.groupfund.backend.config;

import com.groupfund.backend.exception.BusinessException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class SecurityUtils {

    // Trích xuất 'sub' (Keycloak User ID) từ JWT Token của người dùng đang đăng nhập
    public static String getCurrentKeycloakUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("sub");
        }
        throw new BusinessException("Không tìm thấy thông tin xác thực Keycloak JWT trong ngữ cảnh yêu cầu");
    }
}