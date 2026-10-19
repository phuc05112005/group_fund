package com.groupfund.backend.repository;

import com.groupfund.backend.entity.ThanhVienVaiTro;
import com.groupfund.backend.entity.id.ThanhVienVaiTroId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThanhVienVaiTroRepository extends JpaRepository<ThanhVienVaiTro, ThanhVienVaiTroId> {
    List<ThanhVienVaiTro> findByThanhVienNhom_MaThanhVienNhom(Long maThanhVienNhom);
    long countByVaiTro_TenVaiTroAndThanhVienNhom_NhomQuy_MaNhom(String tenVaiTro, Long maNhom);
}
