package com.groupfund.backend.controller;

import com.groupfund.backend.dto.UserSyncRequest;
import com.groupfund.backend.dto.UserUpdateRequest;
import com.groupfund.backend.entity.NguoiDung;
import com.groupfund.backend.service.NguoiDungService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/nguoi-dung")
@RequiredArgsConstructor
public class NguoiDungController {

    private final NguoiDungService nguoiDungService;

    @PostMapping("/sync")
    public ResponseEntity<NguoiDung> dongBoKeycloakUser(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UserSyncRequest request) {
        String keycloakUserId = jwt.getSubject();
        return ResponseEntity.ok(nguoiDungService.dongBoTaiKhoanKeycloak(keycloakUserId, request));
    }

    @GetMapping("/me")
    public ResponseEntity<NguoiDung> getProfile(@AuthenticationPrincipal Jwt jwt) {
        String keycloakUserId = jwt.getSubject();
        return ResponseEntity.ok(nguoiDungService.getThongTinHienTai(keycloakUserId));
    }

    @PutMapping("/me")
    public ResponseEntity<NguoiDung> capNhatProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UserUpdateRequest request) {
        String keycloakUserId = jwt.getSubject();
        return ResponseEntity.ok(nguoiDungService.capNhatThongTinCaNhan(keycloakUserId, request));
    }

    @GetMapping("/{maNguoiDung}")
    public ResponseEntity<NguoiDung> getById(@PathVariable Long maNguoiDung) {
        return ResponseEntity.ok(nguoiDungService.findById(maNguoiDung));
    }
}