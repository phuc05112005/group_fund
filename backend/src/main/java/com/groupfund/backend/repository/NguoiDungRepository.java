package com.groupfund.backend.repository;

import com.groupfund.backend.entity.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {
    Optional<NguoiDung> findByKeycloakUserId(String keycloakUserId);
    Optional<NguoiDung> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsBySoDienThoai(String soDienThoai);
}