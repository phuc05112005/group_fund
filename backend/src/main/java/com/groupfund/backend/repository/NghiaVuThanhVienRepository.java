package com.groupfund.backend.repository;

import com.groupfund.backend.entity.NghiaVuThanhVien;
import com.groupfund.backend.entity.id.NghiaVuThanhVienId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NghiaVuThanhVienRepository extends JpaRepository<NghiaVuThanhVien, NghiaVuThanhVienId> {
    List<NghiaVuThanhVien> findById_MaThanhVienNhom(Long maThanhVienNhom);
    List<NghiaVuThanhVien> findById_MaNghiaVu(Long maNghiaVu);
}