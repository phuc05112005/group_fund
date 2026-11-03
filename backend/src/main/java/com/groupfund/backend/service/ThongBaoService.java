package com.groupfund.backend.service;

import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ThongBaoService {

    private final ThongBaoRepository thongBaoRepository;
    private final NhanThongBaoRepository nhanThongBaoRepository;
    private final NhomQuyRepository nhomQuyRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final NguoiDungRepository nguoiDungRepository;

    @Transactional
    public ThongBao taoThongBaoNhom(Long maNhom, String tieuDe, String noiDung, String loaiThongBao) {
        NhomQuy nhomQuy = nhomQuyRepository.findById(maNhom)
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));

        ThongBao thongBao = new ThongBao();
        thongBao.setNhomQuy(nhomQuy);
        thongBao.setTieuDe(tieuDe);
        thongBao.setNoiDung(noiDung);
        thongBao.setLoaiThongBao(loaiThongBao);
        thongBao = thongBaoRepository.save(thongBao);

        List<ThanhVienNhom> dsThanhVien = thanhVienNhomRepository.findByNhomQuy_MaNhomAndTrangThaiThanhVien(maNhom, "HOAT_DONG");
        for (ThanhVienNhom tv : dsThanhVien) {
            NhanThongBao nhanThongBao = new NhanThongBao();
            nhanThongBao.setId(new NhanThongBaoId(tv.getMaThanhVienNhom(), thongBao.getMaThongBao()));
            nhanThongBao.setThanhVienNhom(tv);
            nhanThongBao.setThongBao(thongBao);
            nhanThongBao.setDaDoc(false);
            nhanThongBaoRepository.save(nhanThongBao);
        }

        return thongBao;
    }

    public List<NhanThongBao> layThongBaoCuaNguoiDung(String keycloakUserId) {
        Optional<NguoiDung> nguoiDungOpt = nguoiDungRepository.findByKeycloakUserId(keycloakUserId);
        if (nguoiDungOpt.isEmpty()) return Collections.emptyList();

        return nhanThongBaoRepository.findByThanhVienNhom_NguoiDung_MaNguoiDungOrderByThongBao_NgayTaoDesc(
                nguoiDungOpt.get().getMaNguoiDung()
        );
    }

    public List<NhanThongBao> layDanhSachThongBaoThanhVien(Long maThanhVienNhom) {
        return nhanThongBaoRepository.findByThanhVienNhom_MaThanhVienNhomOrderByThongBao_NgayTaoDesc(maThanhVienNhom);
    }

    /**
     * Gửi thông báo đến một người dùng cụ thể trong nhóm (Ví dụ: Gửi yêu cầu gia nhập cho Trưởng nhóm)
     */
    @Transactional
    public void guiThongBao(Long maNguoiNhan, String tieuDe, String noiDung, String loaiThongBao, String linkLienKet) {
        List<ThanhVienNhom> dsTv = thanhVienNhomRepository.findByNguoiDung_MaNguoiDung(maNguoiNhan);
        if (dsTv.isEmpty()) return;

        ThanhVienNhom tv = dsTv.get(0);
        ThongBao thongBao = new ThongBao();
        thongBao.setNhomQuy(tv.getNhomQuy());
        thongBao.setTieuDe(tieuDe);
        thongBao.setNoiDung(noiDung);
        thongBao.setLoaiThongBao(loaiThongBao);
        thongBao = thongBaoRepository.save(thongBao);

        NhanThongBao nhanThongBao = new NhanThongBao();
        nhanThongBao.setId(new NhanThongBaoId(tv.getMaThanhVienNhom(), thongBao.getMaThongBao()));
        nhanThongBao.setThanhVienNhom(tv);
        nhanThongBao.setThongBao(thongBao);
        nhanThongBao.setDaDoc(false);
        nhanThongBaoRepository.save(nhanThongBao);
    }

    @Transactional
    public void danhDauDaDoc(Long maThanhVienNhom, Long maThongBao) {
        NhanThongBaoId id = new NhanThongBaoId(maThanhVienNhom, maThongBao);
        NhanThongBao nhanThongBao = nhanThongBaoRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Thông báo không tồn tại cho thành viên này"));

        nhanThongBao.setDaDoc(true);
        nhanThongBaoRepository.save(nhanThongBao);
    }
}