package com.groupfund.backend.repository;

import com.groupfund.backend.entity.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {

    // Tìm người dùng theo keycloakUserId (đọc từ claim 'sub' của JWT Token)
    Optional<NguoiDung> findByKeycloakUserId(String keycloakUserId);

    // Kiểm tra trùng lặp số điện thoại khi đăng ký/cập nhật
    boolean existsBySoDienThoai(String soDienThoai);

    // Kiểm tra trùng lặp email khi đăng ký/cập nhật
    boolean existsByEmail(String email);

    // Tìm người dùng theo số điện thoại
    Optional<NguoiDung> findBySoDienThoai(String soDienThoai);

    // Tìm người dùng theo email
    Optional<NguoiDung> findByEmail(String email);

}