package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ChinhSachBieuQuyet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChinhSachBieuQuyetRepository extends JpaRepository<ChinhSachBieuQuyet, Long> {
    Optional<ChinhSachBieuQuyet> findByNhomQuy_MaNhom(Long maNhom);
}