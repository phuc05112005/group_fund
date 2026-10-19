package com.groupfund.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class TestController {

    @GetMapping("/public/ping")
    public String ping() {
        return "Backend Spring Boot & PostgreSQL connected successfully!";
    }

    // API Private: Yêu cầu phải gửi kèm Bearer Token JWT từ Keycloak
    @GetMapping("/private/hello")
    public String hello(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        String email = jwt.getClaimAsString("email");
        return "Xác thực JWT thành công! Xin chào " + username + " (" + email + ")";
    }
}