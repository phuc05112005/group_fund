package com.groupfund.backend.repository;

import com.groupfund.backend.entity.VaiTro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VaiTroRepository extends JpaRepository<VaiTro, Long> {

    // Tìm vai trò theo tên (QUAN_TRI, THU_QUY, THANH_VIEN)
    Optional<VaiTro> findByTenVaiTro(String tenVaiTro);

    // Kiểm tra tên vai trò đã tồn tại chưa
    boolean existsByTenVaiTro(String tenVaiTro);
}