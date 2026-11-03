package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ChuyenGiaoQuy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChuyenGiaoQuyRepository extends JpaRepository<ChuyenGiaoQuy, Long> {
}