package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ChinhSachPheDuyet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChinhSachPheDuyetRepository extends JpaRepository<ChinhSachPheDuyet, Long> {
    Optional<ChinhSachPheDuyet> findByNhomQuy_MaNhom(Long maNhom);
}