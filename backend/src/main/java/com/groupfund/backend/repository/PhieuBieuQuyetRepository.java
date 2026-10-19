package com.groupfund.backend.repository;

import com.groupfund.backend.entity.PhieuBieuQuyet;
import com.groupfund.backend.enums.LuaChonBieuQuyet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhieuBieuQuyetRepository extends JpaRepository<PhieuBieuQuyet, Long> {
    List<PhieuBieuQuyet> findByDeXuatChi_MaDeXuat(Long maDeXuat);
    Optional<PhieuBieuQuyet> findByDeXuatChi_MaDeXuatAndThanhVienNhom_MaThanhVienNhom(Long maDeXuat, Long maThanhVienNhom);
    long countByDeXuatChi_MaDeXuatAndLuaChon(Long maDeXuat, LuaChonBieuQuyet luaChon);
}