package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ChiTietKhoanChi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChiTietKhoanChiRepository extends JpaRepository<ChiTietKhoanChi, Long> {
}