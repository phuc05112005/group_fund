package com.groupfund.backend.repository;

import com.groupfund.backend.entity.NhomQuy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NhomQuyRepository extends JpaRepository<NhomQuy, Long> {

    Optional<NhomQuy> findByMaMoi(String maMoi);

    @Query("SELECT DISTINCT n FROM NhomQuy n JOIN ThanhVienNhom tv ON n.maNhom = tv.nhomQuy.maNhom WHERE tv.nguoiDung.maNguoiDung = :maNguoiDung")
    List<NhomQuy> findByThanhVienNhom_NguoiDung_MaNguoiDung(@Param("maNguoiDung") Long maNguoiDung);
}