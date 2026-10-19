package com.groupfund.backend.service.impl;

import com.groupfund.backend.dto.*;
import com.groupfund.backend.entity.*;
import com.groupfund.backend.enums.*;
import com.groupfund.backend.repository.*;
import com.groupfund.backend.service.QuanLyChiService;
import com.groupfund.backend.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class QuanLyChiServiceImpl implements QuanLyChiService {

    private final DeXuatChiRepository deXuatChiRepository;
    private final PhieuBieuQuyetRepository phieuBieuQuyetRepository;
    private final KhoanChiRepository khoanChiRepository;
    private final ChuyenGiaoQuyRepository chuyenGiaoQuyRepository;
    private final NhomQuyRepository nhomQuyRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final ThanhVienVaiTroRepository thanhVienVaiTroRepository;
    private final ChinhSachPheDuyetRepository chinhSachPheDuyetRepository;
    private final SecurityUtils securityUtils;

    @Autowired
    public QuanLyChiServiceImpl(
            DeXuatChiRepository deXuatChiRepository,
            PhieuBieuQuyetRepository phieuBieuQuyetRepository,
            KhoanChiRepository khoanChiRepository,
            ChuyenGiaoQuyRepository chuyenGiaoQuyRepository,
            NhomQuyRepository nhomQuyRepository,
            ThanhVienNhomRepository thanhVienNhomRepository,
            ThanhVienVaiTroRepository thanhVienVaiTroRepository,
            ChinhSachPheDuyetRepository chinhSachPheDuyetRepository,
            SecurityUtils securityUtils
    ) {
        this.deXuatChiRepository = deXuatChiRepository;
        this.phieuBieuQuyetRepository = phieuBieuQuyetRepository;
        this.khoanChiRepository = khoanChiRepository;
        this.chuyenGiaoQuyRepository = chuyenGiaoQuyRepository;
        this.nhomQuyRepository = nhomQuyRepository;
        this.thanhVienNhomRepository = thanhVienNhomRepository;
        this.thanhVienVaiTroRepository = thanhVienVaiTroRepository;
        this.chinhSachPheDuyetRepository = chinhSachPheDuyetRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional
    public DeXuatChiResponse taoDeXuatChi(TaoDeXuatChiRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        NhomQuy nhomQuy = nhomQuyRepository.findById(request.getMaNhom())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        ThanhVienNhom nguoiTao = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(nhomQuy.getMaNhom(), currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        List<ThanhVienVaiTro> vaiTros = thanhVienVaiTroRepository.findByThanhVienNhom_MaThanhVienNhom(nguoiTao.getMaThanhVienNhom());
        boolean isThuQuyOrAdmin = vaiTros != null && vaiTros.stream().anyMatch(v ->
                v.getVaiTro() != null && ("ADMIN".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()) || "THU_QUY".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()))
        );

        ChinhSachPheDuyet chinhSach = chinhSachPheDuyetRepository.findByNhomQuy_MaNhom(nhomQuy.getMaNhom()).orElse(null);
        boolean batPheDuyet = chinhSach != null && Boolean.TRUE.equals(chinhSach.getBatPheDuyet());
        boolean batBieuQuyet = chinhSach != null && Boolean.TRUE.equals(chinhSach.getBatBieuQuyet());
        int thoiHanGio = (chinhSach != null && chinhSach.getThoiHanBieuQuyetGio() != null) ? chinhSach.getThoiHanBieuQuyetGio() : 24;

        BigDecimal soDuHienTai = nhomQuy.getSoDuHienTai() != null ? nhomQuy.getSoDuHienTai() : BigDecimal.ZERO;

        // LUỒNG 1: THỦ QUỸ/ADMIN TỰ CHI HOẶC NHÓM TẮT PHÊ DUYỆT -> THỰC HIỆN CHI NGAY
        if (isThuQuyOrAdmin || !batPheDuyet) {
            if (soDuHienTai.compareTo(request.getSoTienDeXuat()) < 0) {
                throw new RuntimeException("Số dư quỹ hiện tại không đủ để thực hiện khoản chi này!");
            }

            DeXuatChi deXuat = DeXuatChi.builder()
                    .nhomQuy(nhomQuy)
                    .nguoiTao(nguoiTao)
                    .tieuDe(request.getTieuDe())
                    .mucDich(request.getMucDich())
                    .soTienDeXuat(request.getSoTienDeXuat())
                    .nguoiNhan(request.getNguoiNhan())
                    .duongDanMinhChung(request.getDuongDanMinhChung())
                    .ghiChu(request.getGhiChu())
                    .trangThai(TrangThaiDeXuat.DA_THANH_TOAN)
                    .ngayTao(OffsetDateTime.now())
                    .build();
            deXuat = deXuatChiRepository.save(deXuat);

            KhoanChi khoanChi = KhoanChi.builder()
                    .nhomQuy(nhomQuy)
                    .deXuatChi(deXuat)
                    .thuQuyThucHien(nguoiTao)
                    .soTienThucChi(request.getSoTienDeXuat())
                    .phuongThuc("BANK_TRANSFER")
                    .duongDanMinhChung(request.getDuongDanMinhChung())
                    .ghiChu(request.getGhiChu())
                    .ngayChi(OffsetDateTime.now())
                    .ngayGhiNhan(OffsetDateTime.now())
                    .build();
            khoanChiRepository.save(khoanChi);

            nhomQuy.setSoDuHienTai(soDuHienTai.subtract(request.getSoTienDeXuat()));
            nhomQuyRepository.save(nhomQuy);

            return mapToDeXuatResponse(deXuat);
        }

        // LUỒNG 2: NHÓM BẬT PHÊ DUYỆT -> TẠO ĐỀ XUẤT CHỜ DUYỆT
        DeXuatChi deXuat = DeXuatChi.builder()
                .nhomQuy(nhomQuy)
                .nguoiTao(nguoiTao)
                .tieuDe(request.getTieuDe())
                .mucDich(request.getMucDich())
                .soTienDeXuat(request.getSoTienDeXuat())
                .nguoiNhan(request.getNguoiNhan())
                .duongDanMinhChung(request.getDuongDanMinhChung())
                .ghiChu(request.getGhiChu())
                .trangThai(TrangThaiDeXuat.CHO_DUYET)
                .ngayTao(OffsetDateTime.now())
                .hanBieuQuyet(OffsetDateTime.now().plusHours(thoiHanGio))
                .build();

        deXuat = deXuatChiRepository.save(deXuat);
        return mapToDeXuatResponse(deXuat);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DeXuatChiResponse> layDanhSachDeXuatByNhom(Long maNhom) {
        List<DeXuatChi> list = deXuatChiRepository.findByNhomQuy_MaNhom(maNhom);
        return list.stream().map(this::mapToDeXuatResponse).toList();
    }

    @Override
    @Transactional
    public DeXuatChiResponse bieuQuyetDeXuat(Long maDeXuat, BieuQuyetRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        DeXuatChi deXuat = deXuatChiRepository.findById(maDeXuat)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề xuất chi!"));

        if (deXuat.getTrangThai() != TrangThaiDeXuat.CHO_DUYET) {
            throw new RuntimeException("Đề xuất chi này không trong trạng thái chờ biểu quyết!");
        }

        ThanhVienNhom thanhVien = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(deXuat.getNhomQuy().getMaNhom(), currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        Optional<PhieuBieuQuyet> existingPhieu = phieuBieuQuyetRepository
                .findByDeXuatChi_MaDeXuatAndThanhVienNhom_MaThanhVienNhom(maDeXuat, thanhVien.getMaThanhVienNhom());

        PhieuBieuQuyet phieu;
        if (existingPhieu.isPresent()) {
            phieu = existingPhieu.get();
            phieu.setLuaChon(request.getLuaChon());
            phieu.setNgayCapNhat(OffsetDateTime.now());
        } else {
            phieu = PhieuBieuQuyet.builder()
                    .deXuatChi(deXuat)
                    .thanhVienNhom(thanhVien)
                    .luaChon(request.getLuaChon())
                    .ngayBieuQuyet(OffsetDateTime.now())
                    .build();
        }
        phieuBieuQuyetRepository.save(phieu);

        List<ThanhVienNhom> tatCaThanhVien = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndTrangThaiThanhVien(deXuat.getNhomQuy().getMaNhom(), TrangThaiThanhVien.HOAT_DONG);
        long soPhieuDongY = phieuBieuQuyetRepository.countByDeXuatChi_MaDeXuatAndLuaChon(maDeXuat, LuaChonBieuQuyet.DONG_Y);

        if (soPhieuDongY > tatCaThanhVien.size() / 2) {
            deXuat.setTrangThai(TrangThaiDeXuat.DA_DUYET);
            deXuatChiRepository.save(deXuat);
        }

        return mapToDeXuatResponse(deXuat);
    }

    @Override
    @Transactional
    public DeXuatChiResponse thucHienChiTien(Long maDeXuat) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        DeXuatChi deXuat = deXuatChiRepository.findById(maDeXuat)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề xuất chi!"));

        if (deXuat.getTrangThai() != TrangThaiDeXuat.DA_DUYET) {
            throw new RuntimeException("Chỉ đề xuất đã được phê duyệt mới được thực hiện chi!");
        }

        NhomQuy nhomQuy = deXuat.getNhomQuy();
        BigDecimal soDuHienTai = nhomQuy.getSoDuHienTai() != null ? nhomQuy.getSoDuHienTai() : BigDecimal.ZERO;

        if (soDuHienTai.compareTo(deXuat.getSoTienDeXuat()) < 0) {
            throw new RuntimeException("Số dư quỹ hiện tại không đủ để thực hiện khoản chi này!");
        }

        ThanhVienNhom thuQuyThucHien = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(nhomQuy.getMaNhom(), currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        KhoanChi khoanChi = KhoanChi.builder()
                .nhomQuy(nhomQuy)
                .deXuatChi(deXuat)
                .thuQuyThucHien(thuQuyThucHien)
                .soTienThucChi(deXuat.getSoTienDeXuat())
                .phuongThuc("BANK_TRANSFER")
                .duongDanMinhChung(deXuat.getDuongDanMinhChung())
                .ghiChu(deXuat.getGhiChu())
                .ngayChi(OffsetDateTime.now())
                .ngayGhiNhan(OffsetDateTime.now())
                .build();
        khoanChiRepository.save(khoanChi);

        nhomQuy.setSoDuHienTai(soDuHienTai.subtract(deXuat.getSoTienDeXuat()));
        nhomQuyRepository.save(nhomQuy);

        deXuat.setTrangThai(TrangThaiDeXuat.DA_THANH_TOAN);
        deXuat = deXuatChiRepository.save(deXuat);

        return mapToDeXuatResponse(deXuat);
    }

    @Override
    @Transactional
    public ChuyenGiaoQuyResponse taoChuyenGiaoQuy(ChuyenGiaoQuyRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        NhomQuy nhomQuy = nhomQuyRepository.findById(request.getMaNhom())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        ThanhVienNhom nguoiChuyen = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(nhomQuy.getMaNhom(), currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        ThanhVienNhom nguoiNhan = thanhVienNhomRepository.findById(request.getMaThanhVienNhan())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận bàn giao!"));

        ChuyenGiaoQuy chuyenGiao = ChuyenGiaoQuy.builder()
                .nhomQuy(nhomQuy)
                .nguoiChuyen(nguoiChuyen)
                .nguoiNhan(nguoiNhan)
                .soTien(request.getSoTien())
                .ghiChu(request.getGhiChu())
                .duongDanMinhChung(request.getDuongDanMinhChung())
                .trangThai(TrangThaiChuyenGiao.DA_XAC_NHAN)
                .ngayTao(OffsetDateTime.now())
                .ngayXacNhan(OffsetDateTime.now())
                .build();

        chuyenGiao = chuyenGiaoQuyRepository.save(chuyenGiao);
        return mapToChuyenGiaoResponse(chuyenGiao);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChuyenGiaoQuyResponse> layDanhSachChuyenGiaoByNhom(Long maNhom) {
        List<ChuyenGiaoQuy> list = chuyenGiaoQuyRepository.findByNhomQuy_MaNhom(maNhom);
        return list.stream().map(this::mapToChuyenGiaoResponse).toList();
    }

    private DeXuatChiResponse mapToDeXuatResponse(DeXuatChi dx) {
        if (dx == null) return null;

        long soDongY = phieuBieuQuyetRepository.countByDeXuatChi_MaDeXuatAndLuaChon(dx.getMaDeXuat(), LuaChonBieuQuyet.DONG_Y);
        long soKhongDongY = phieuBieuQuyetRepository.countByDeXuatChi_MaDeXuatAndLuaChon(dx.getMaDeXuat(), LuaChonBieuQuyet.KHONG_DONG_Y);

        String tenNguoiTao = (dx.getNguoiTao() != null && dx.getNguoiTao().getNguoiDung() != null)
                ? dx.getNguoiTao().getNguoiDung().getHoTen()
                : "Thành viên";

        return DeXuatChiResponse.builder()
                .maDeXuat(dx.getMaDeXuat())
                .maNhom(dx.getNhomQuy() != null ? dx.getNhomQuy().getMaNhom() : null)
                .tenNguoiTao(tenNguoiTao)
                .tieuDe(dx.getTieuDe())
                .mucDich(dx.getMucDich())
                .soTienDeXuat(dx.getSoTienDeXuat())
                .nguoiNhan(dx.getNguoiNhan())
                .duongDanMinhChung(dx.getDuongDanMinhChung())
                .ghiChu(dx.getGhiChu())
                .trangThai(dx.getTrangThai())
                .ngayTao(dx.getNgayTao())
                .hanBieuQuyet(dx.getHanBieuQuyet())
                .soPhieuDongY(soDongY)
                .soPhieuKhongDongY(soKhongDongY)
                .build();
    }

    private ChuyenGiaoQuyResponse mapToChuyenGiaoResponse(ChuyenGiaoQuy cg) {
        if (cg == null) return null;

        String tenNguoiChuyen = (cg.getNguoiChuyen() != null && cg.getNguoiChuyen().getNguoiDung() != null)
                ? cg.getNguoiChuyen().getNguoiDung().getHoTen() : "N/A";
        String tenNguoiNhan = (cg.getNguoiNhan() != null && cg.getNguoiNhan().getNguoiDung() != null)
                ? cg.getNguoiNhan().getNguoiDung().getHoTen() : "N/A";

        return ChuyenGiaoQuyResponse.builder()
                .maChuyenGiao(cg.getMaChuyenGiao())
                .maNhom(cg.getNhomQuy() != null ? cg.getNhomQuy().getMaNhom() : null)
                .tenNguoiChuyen(tenNguoiChuyen)
                .tenNguoiNhan(tenNguoiNhan)
                .soTien(cg.getSoTien())
                .trangThai(cg.getTrangThai())
                .ghiChu(cg.getGhiChu())
                .duongDanMinhChung(cg.getDuongDanMinhChung())
                .ngayTao(cg.getNgayTao())
                .ngayXacNhan(cg.getNgayXacNhan())
                .build();
    }
}