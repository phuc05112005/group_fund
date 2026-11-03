package com.groupfund.backend.service;

import com.groupfund.backend.config.SecurityUtils;
import com.groupfund.backend.dto.UserSyncRequest;
import com.groupfund.backend.dto.UserUpdateRequest;
import com.groupfund.backend.entity.NguoiDung;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.NguoiDungRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class NguoiDungService {

    private final NguoiDungRepository nguoiDungRepository;
    private final Keycloak keycloakAdminClient;

    private static final String REALM_NAME = "group-fund-realm";

    @Transactional
    public NguoiDung dongBoTaiKhoanKeycloak(String keycloakUserId, UserSyncRequest request) {
        String activeKeycloakId = (keycloakUserId != null && !keycloakUserId.isBlank())
                ? keycloakUserId
                : SecurityUtils.getCurrentKeycloakUserId();

        String cleanPhone = (request.getSoDienThoai() != null && !request.getSoDienThoai().isBlank())
                ? request.getSoDienThoai().trim()
                : null;

        // 1. Tìm theo Keycloak ID; nếu không thấy thì tìm theo Email
        NguoiDung user = nguoiDungRepository.findByKeycloakUserId(activeKeycloakId)
                .orElseGet(() -> nguoiDungRepository.findByEmail(request.getEmail())
                        .orElse(new NguoiDung()));

        // 2. Thiết lập/Cập nhật các thông tin
        if (user.getMaNguoiDung() == null) {
            user.setTrangThai("ACTIVE");
            user.setNgayTao(OffsetDateTime.now());
        }

        user.setKeycloakUserId(activeKeycloakId);
        user.setHoTen(request.getHoTen());
        user.setSoDienThoai(cleanPhone);
        user.setEmail(request.getEmail());
        user.setNgayCapNhat(OffsetDateTime.now());

        return nguoiDungRepository.save(user);
    }

    @Transactional
    public NguoiDung capNhatThongTinCaNhan(String keycloakUserId, UserUpdateRequest request) {
        String activeKeycloakId = (keycloakUserId != null && !keycloakUserId.isBlank())
                ? keycloakUserId
                : SecurityUtils.getCurrentKeycloakUserId();

        NguoiDung nguoiDung = nguoiDungRepository.findByKeycloakUserId(activeKeycloakId)
                .orElseThrow(() -> new BusinessException("Không tìm thấy thông tin người dùng trong hệ thống"));

        nguoiDung.setHoTen(request.getHoTen());

        // CHUẨN HÓA: Chuyển rỗng thành NULL
        String cleanPhone = (request.getSoDienThoai() != null && !request.getSoDienThoai().isBlank())
                ? request.getSoDienThoai().trim()
                : null;
        nguoiDung.setSoDienThoai(cleanPhone);

        if (request.getEmail() != null) {
            nguoiDung.setEmail(request.getEmail());
        }

        // Bổ sung cập nhật thông tin Ngân hàng
        nguoiDung.setTenNganHang(request.getTenNganHang());
        nguoiDung.setSoTaiKhoan(request.getSoTaiKhoan());
        nguoiDung.setTenChuTaiKhoan(request.getTenChuTaiKhoan());
        nguoiDung.setQrThanhToanUrl(request.getQrThanhToanUrl());
        nguoiDung.setNgayCapNhat(OffsetDateTime.now());

        NguoiDung savedUser = nguoiDungRepository.save(nguoiDung);

        try {
            UserResource userResource = keycloakAdminClient.realm(REALM_NAME).users().get(activeKeycloakId);
            UserRepresentation keycloakUser = userResource.toRepresentation();

            keycloakUser.setFirstName(request.getHoTen());
            if (request.getEmail() != null) {
                keycloakUser.setEmail(request.getEmail());
            }

            userResource.update(keycloakUser);
        } catch (Exception e) {
            log.error("Lỗi khi đồng bộ thông tin sang Keycloak: {}", e.getMessage());
        }

        return savedUser;
    }

    public NguoiDung getThongTinHienTai(String keycloakUserId) {
        String activeKeycloakId = (keycloakUserId != null && !keycloakUserId.isBlank())
                ? keycloakUserId
                : SecurityUtils.getCurrentKeycloakUserId();

        return nguoiDungRepository.findByKeycloakUserId(activeKeycloakId)
                .orElseThrow(() -> new BusinessException("Chưa tìm thấy hồ sơ người dùng trong hệ thống. Vui lòng đồng bộ thông tin!"));
    }

    public NguoiDung findById(Long maNguoiDung) {
        return nguoiDungRepository.findById(maNguoiDung)
                .orElseThrow(() -> new BusinessException("Người dùng ID " + maNguoiDung + " không tồn tại"));
    }
}