package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ChuyenGiaoQuy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChuyenGiaoQuyRepository extends JpaRepository<ChuyenGiaoQuy, Long> {
    List<ChuyenGiaoQuy> findByNhomQuy_MaNhom(Long maNhom);
}