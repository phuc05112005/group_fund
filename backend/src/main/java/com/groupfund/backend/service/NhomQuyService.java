package com.groupfund.backend.service;

import com.groupfund.backend.dto.ThanhVienGroupDto;
import com.groupfund.backend.entity.*;
import com.groupfund.backend.exception.BusinessException;
import com.groupfund.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NhomQuyService {

    private final NhomQuyRepository nhomQuyRepository;
    private final NguoiDungRepository nguoiDungRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final VaiTroRepository vaiTroRepository;
    private final ThanhVienVaiTroRepository thanhVienVaiTroRepository;
    private final ChinhSachBieuQuyetRepository chinhSachBieuQuyetRepository;
    private final YeuCauThamGiaRepository yeuCauThamGiaRepository;
    private final ThongBaoService thongBaoService;

    /**
     * Lấy danh sách nhóm mà một người dùng tham gia theo Keycloak User ID
     */
    public List<NhomQuy> layDanhSachNhomCuaNguoiDung(String keycloakUserId) {
        NguoiDung nguoiDung = nguoiDungRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));

        List<ThanhVienNhom> dsThanhVien = thanhVienNhomRepository.findByNguoiDung_MaNguoiDung(nguoiDung.getMaNguoiDung());
        return dsThanhVien.stream()
                .map(ThanhVienNhom::getNhomQuy)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết một nhóm quỹ theo ID
     */
    public NhomQuy layChiTietNhom(Long maNhom) {
        return nhomQuyRepository.findById(maNhom)
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));
    }

    /**
     * Lấy danh sách tất cả thành viên trong nhóm kèm theo danh sách vai trò
     */
    public List<ThanhVienGroupDto> layDanhSachThanhVien(Long maNhom) {
        List<ThanhVienNhom> dsThanhVien = thanhVienNhomRepository.findByNhomQuy_MaNhom(maNhom);

        return dsThanhVien.stream().map(tv -> {
            List<String> vaiTros = thanhVienVaiTroRepository.findById_ThanhVienId(tv.getMaThanhVienNhom())
                    .stream()
                    .map(tvvt -> tvvt.getVaiTro().getTenVaiTro())
                    .collect(Collectors.toList());

            return ThanhVienGroupDto.builder()
                    .maThanhVienNhom(tv.getMaThanhVienNhom())
                    .hoTen(tv.getNguoiDung().getHoTen())
                    .email(tv.getNguoiDung().getEmail())
                    .soDuCaNhan(tv.getSoDuCaNhan())
                    .soTienDangGiu(tv.getSoTienDangGiu())
                    .trangThaiThanhVien(tv.getTrangThaiThanhVien())
                    .danhSachVaiTro(vaiTros)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Tạo nhóm quỹ mới
     */
    @Transactional
    public NhomQuy taoNhomMoi(Long maNguoiTao, String tenNhom, String moTa, String loaiTienTe, String cheDoRiengTu, BigDecimal mucTieuQuy) {
        NguoiDung nguoiTao = nguoiDungRepository.findById(maNguoiTao)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));

        NhomQuy nhomQuy = new NhomQuy();
        nhomQuy.setNguoiTao(nguoiTao);
        nhomQuy.setTenNhom(tenNhom);
        nhomQuy.setMoTa(moTa);
        nhomQuy.setLoaiTienTe(loaiTienTe != null ? loaiTienTe : "VND");
        nhomQuy.setCheDoRiengTu(cheDoRiengTu != null ? cheDoRiengTu : "RIENG_TU");
        nhomQuy.setMucTieuQuy(mucTieuQuy != null ? mucTieuQuy : BigDecimal.ZERO);
        nhomQuy.setSoDuQuy(BigDecimal.ZERO);
        nhomQuy.setTrangThai("ACTIVE");

        String maMoi;
        do {
            maMoi = "GF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        } while (nhomQuyRepository.findByMaMoi(maMoi).isPresent());
        nhomQuy.setMaMoi(maMoi);

        nhomQuy = nhomQuyRepository.saveAndFlush(nhomQuy);

        // Tạo thành viên nhóm cho người tạo
        ThanhVienNhom thanhVien = new ThanhVienNhom();
        thanhVien.setNguoiDung(nguoiTao);
        thanhVien.setNhomQuy(nhomQuy);
        thanhVien.setSoDuCaNhan(BigDecimal.ZERO);
        thanhVien.setSoTienDangGiu(BigDecimal.ZERO);
        thanhVien.setTrangThaiThanhVien("HOAT_DONG");

        thanhVien = thanhVienNhomRepository.saveAndFlush(thanhVien);

        // Gán vai trò QUAN_TRI và THU_QUY cho người tạo
        ganVaiTro(thanhVien, "QUAN_TRI");
        ganVaiTro(thanhVien, "THU_QUY");

        // Khởi tạo Chính sách biểu quyết
        ChinhSachBieuQuyet chinhSach = new ChinhSachBieuQuyet();
        chinhSach.setNhomQuy(nhomQuy);
        chinhSach.setTyLeDongYToiThieu(new BigDecimal("50.00"));
        chinhSach.setThoiGianHieuLucHours(48);
        chinhSachBieuQuyetRepository.saveAndFlush(chinhSach);

        return nhomQuy;
    }

    /**
     * Tham gia nhóm bằng Mã mời (GF-XXXXXX)
     */
    @Transactional
    public String thamGiaBangMa(String maMoi, String keycloakUserId) {
        NhomQuy nhom = nhomQuyRepository.findByMaMoi(maMoi)
                .orElseThrow(() -> new BusinessException("Mã nhóm không tồn tại!"));

        NguoiDung user = nguoiDungRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại!"));

        // 1. Kiểm tra xem người dùng đã là thành viên chính thức chưa
        Optional<ThanhVienNhom> tvOpt = thanhVienNhomRepository
                .findByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(user.getMaNguoiDung(), nhom.getMaNhom());

        if (tvOpt.isPresent() && "HOAT_DONG".equals(tvOpt.get().getTrangThaiThanhVien())) {
            throw new BusinessException("Bạn đã là thành viên của nhóm này rồi!");
        }

        // 2. Kiểm tra nhóm RIÊNG TƯ vs CÔNG KHAI
        if ("RIENG_TU".equals(nhom.getCheDoRiengTu())) {
            // Kiểm tra xem đã có yêu cầu đang chờ duyệt chưa
            boolean daCoYeuCau = yeuCauThamGiaRepository
                    .existsByNguoiDung_MaNguoiDungAndNhomQuy_MaNhomAndTrangThai(
                            user.getMaNguoiDung(), nhom.getMaNhom(), "CHO_DUYET");

            if (daCoYeuCau) {
                throw new BusinessException("Yêu cầu gia nhập của bạn đang chờ Quản trị viên phê duyệt!");
            }

            // Tạo yêu cầu gia nhập mới trong bảng YeuCauThamGia
            YeuCauThamGia yeuCau = new YeuCauThamGia();
            yeuCau.setNguoiDung(user);
            yeuCau.setNhomQuy(nhom);
            yeuCau.setTrangThai("CHO_DUYET");
            yeuCau.setLyDoNote("Yêu cầu tham gia qua mã mời: " + maMoi);
            yeuCauThamGiaRepository.save(yeuCau);

            // Gửi thông báo đến TẤT CẢ Quản trị viên của nhóm
            List<ThanhVienNhom> dsThanhVien = thanhVienNhomRepository.findByNhomQuy_MaNhom(nhom.getMaNhom());
            for (ThanhVienNhom tv : dsThanhVien) {
                boolean isQuanTri = thanhVienVaiTroRepository.findById_ThanhVienId(tv.getMaThanhVienNhom())
                        .stream().anyMatch(v -> "QUAN_TRI".equals(v.getVaiTro().getTenVaiTro()));

                if (isQuanTri && thongBaoService != null) {
                    thongBaoService.guiThongBao(
                            tv.getNguoiDung().getMaNguoiDung(),
                            "Yêu cầu gia nhập nhóm mới",
                            user.getHoTen() + " gửi yêu cầu tham gia nhóm riêng tư: " + nhom.getTenNhom(),
                            "YEU_CAU_VAO_NHOM",
                            "/groups/" + nhom.getMaNhom()
                    );
                }
            }

            return "Yêu cầu tham gia nhóm riêng tư đã được gửi! Vui lòng chờ Quản trị viên phê duyệt.";
        } else {
            // Nhóm CÔNG KHAI: Cho vào nhóm ngay lập tức
            ThanhVienNhom thanhVien = tvOpt.orElse(new ThanhVienNhom());
            thanhVien.setNhomQuy(nhom);
            thanhVien.setNguoiDung(user);
            if (thanhVien.getSoDuCaNhan() == null) thanhVien.setSoDuCaNhan(BigDecimal.ZERO);
            if (thanhVien.getSoTienDangGiu() == null) thanhVien.setSoTienDangGiu(BigDecimal.ZERO);
            thanhVien.setTrangThaiThanhVien("HOAT_DONG");

            thanhVien = thanhVienNhomRepository.saveAndFlush(thanhVien);

            return "Tham gia nhóm công khai thành công!";
        }
    }

    /**
     * Lấy danh sách các yêu cầu tham gia đang chờ duyệt của nhóm (Chỉ Admin)
     */
    public List<YeuCauThamGia> layDanhSachYeuCauThamGia(Long maNhom, String keycloakUserIdAdmin) {
        kiemTraQuyenQuanTri(maNhom, keycloakUserIdAdmin);
        return yeuCauThamGiaRepository.findByNhomQuy_MaNhomAndTrangThai(maNhom, "CHO_DUYET");
    }

    /**
     * Duyệt hoặc Từ chối yêu cầu gia nhập (Chỉ cần 1 Admin duyệt)
     */
    @Transactional
    public String duyetYeuCauThamGia(Long maYeuCau, boolean dongY, String keycloakUserIdAdmin) {
        YeuCauThamGia yeuCau = yeuCauThamGiaRepository.findById(maYeuCau)
                .orElseThrow(() -> new BusinessException("Yêu cầu gia nhập không tồn tại!"));

        if (!"CHO_DUYET".equals(yeuCau.getTrangThai())) {
            throw new BusinessException("Yêu cầu này đã được xử lý bởi một Quản trị viên khác!");
        }

        kiemTraQuyenQuanTri(yeuCau.getNhomQuy().getMaNhom(), keycloakUserIdAdmin);

        if (dongY) {
            yeuCau.setTrangThai("DA_DUYET");

            NguoiDung user = yeuCau.getNguoiDung();
            NhomQuy nhom = yeuCau.getNhomQuy();

            ThanhVienNhom thanhVien = thanhVienNhomRepository
                    .findByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(user.getMaNguoiDung(), nhom.getMaNhom())
                    .orElse(new ThanhVienNhom());

            thanhVien.setNhomQuy(nhom);
            thanhVien.setNguoiDung(user);
            if (thanhVien.getSoDuCaNhan() == null) thanhVien.setSoDuCaNhan(BigDecimal.ZERO);
            if (thanhVien.getSoTienDangGiu() == null) thanhVien.setSoTienDangGiu(BigDecimal.ZERO);
            thanhVien.setTrangThaiThanhVien("HOAT_DONG");

            thanhVien = thanhVienNhomRepository.saveAndFlush(thanhVien);

            if (thongBaoService != null) {
                thongBaoService.guiThongBao(
                        user.getMaNguoiDung(),
                        "Yêu cầu gia nhập được chấp nhận",
                        "Bạn đã chính thức trở thành thành viên của nhóm: " + nhom.getTenNhom(),
                        "THAM_GIA_THANH_CONG",
                        "/groups/" + nhom.getMaNhom()
                );
            }
        } else {
            yeuCau.setTrangThai("TU_CHOI");

            if (thongBaoService != null) {
                thongBaoService.guiThongBao(
                        yeuCau.getNguoiDung().getMaNguoiDung(),
                        "Yêu cầu gia nhập bị từ chối",
                        "Rất tiếc, yêu cầu tham gia nhóm " + yeuCau.getNhomQuy().getTenNhom() + " của bạn đã bị từ chối.",
                        "YEU_CAU_TU_CHOI",
                        null
                );
            }
        }

        yeuCauThamGiaRepository.save(yeuCau);
        return dongY ? "Đã duyệt thành viên vào nhóm thành công!" : "Đã từ chối yêu cầu gia nhập.";
    }

    /**
     * Đóng / Giải thể Nhóm Quỹ
     */
    @Transactional
    public void dongNhom(Long maNhom) {
        NhomQuy nhomQuy = nhomQuyRepository.findById(maNhom)
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));

        nhomQuy.setTrangThai("CLOSED");
        nhomQuyRepository.saveAndFlush(nhomQuy);
    }

    /**
     * Rời khỏi Nhóm Quỹ
     */
    @Transactional
    public void roiNhom(Long maNhom, String keycloakUserId) {
        NguoiDung nguoiDung = nguoiDungRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại"));

        ThanhVienNhom thanhVien = thanhVienNhomRepository.findByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(
                        nguoiDung.getMaNguoiDung(), maNhom)
                .orElseThrow(() -> new BusinessException("Bạn không phải thành viên nhóm này"));

        if (thanhVien.getSoTienDangGiu() != null && thanhVien.getSoTienDangGiu().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessException("Bạn đang giữ tiền quỹ! Vui lòng bàn giao lại cho thủ quỹ khác trước khi rời nhóm.");
        }

        thanhVienVaiTroRepository.deleteById_ThanhVienId(thanhVien.getMaThanhVienNhom());
        thanhVienNhomRepository.delete(thanhVien);
    }

    /**
     * Cập nhật thông tin Nhóm Quỹ
     */
    @Transactional
    public NhomQuy capNhatNhom(Long maNhom, String tenNhom, String moTa, String cheDoRiengTu, BigDecimal mucTieuQuy) {
        NhomQuy nhomQuy = nhomQuyRepository.findById(maNhom)
                .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));

        if (tenNhom != null && !tenNhom.trim().isEmpty()) nhomQuy.setTenNhom(tenNhom);
        if (moTa != null) nhomQuy.setMoTa(moTa);
        if (cheDoRiengTu != null) nhomQuy.setCheDoRiengTu(cheDoRiengTu);
        if (mucTieuQuy != null) nhomQuy.setMucTieuQuy(mucTieuQuy);

        return nhomQuyRepository.saveAndFlush(nhomQuy);
    }

    /**
     * Lấy chính sách biểu quyết hiện tại của nhóm
     */
    public ChinhSachBieuQuyet layChinhSachBieuQuyet(Long maNhom) {
        return chinhSachBieuQuyetRepository.findByNhomQuy_MaNhom(maNhom)
                .orElseGet(() -> {
                    ChinhSachBieuQuyet cs = new ChinhSachBieuQuyet();
                    cs.setTyLeDongYToiThieu(new BigDecimal("50.00"));
                    cs.setThoiGianHieuLucHours(48);
                    return cs;
                });
    }

    /**
     * Cập nhật Cấu hình Biểu quyết nhóm
     */
    @Transactional
    public ChinhSachBieuQuyet capNhatChinhSachBieuQuyet(Long maNhom, BigDecimal tyLeDongYToiThieu, Integer thoiGianHieuLucHours) {
        ChinhSachBieuQuyet cs = chinhSachBieuQuyetRepository.findByNhomQuy_MaNhom(maNhom)
                .orElseGet(() -> {
                    NhomQuy nq = nhomQuyRepository.findById(maNhom)
                            .orElseThrow(() -> new BusinessException("Nhóm quỹ không tồn tại"));
                    ChinhSachBieuQuyet newCs = new ChinhSachBieuQuyet();
                    newCs.setNhomQuy(nq);
                    return newCs;
                });

        if (tyLeDongYToiThieu != null) cs.setTyLeDongYToiThieu(tyLeDongYToiThieu);
        if (thoiGianHieuLucHours != null) cs.setThoiGianHieuLucHours(thoiGianHieuLucHours);

        return chinhSachBieuQuyetRepository.saveAndFlush(cs);
    }

    private void kiemTraQuyenQuanTri(Long maNhom, String keycloakUserId) {
        NguoiDung user = nguoiDungRepository.findByKeycloakUserId(keycloakUserId)
                .orElseThrow(() -> new BusinessException("Người dùng không tồn tại!"));

        ThanhVienNhom tv = thanhVienNhomRepository.findByNguoiDung_MaNguoiDungAndNhomQuy_MaNhom(user.getMaNguoiDung(), maNhom)
                .orElseThrow(() -> new BusinessException("Bạn không phải thành viên nhóm này!"));

        boolean isQuanTri = thanhVienVaiTroRepository.findById_ThanhVienId(tv.getMaThanhVienNhom())
                .stream().anyMatch(v -> "QUAN_TRI".equals(v.getVaiTro().getTenVaiTro()));

        if (!isQuanTri) {
            throw new BusinessException("Bạn không có quyền Quản trị viên trong nhóm này!");
        }
    }

    private void ganVaiTro(ThanhVienNhom thanhVien, String tenVaiTro) {
        VaiTro vaiTro = vaiTroRepository.findByTenVaiTro(tenVaiTro)
                .orElseThrow(() -> new BusinessException("Vai trò " + tenVaiTro + " không tồn tại trong hệ thống"));

        ThanhVienVaiTroId id = new ThanhVienVaiTroId(thanhVien.getMaThanhVienNhom(), vaiTro.getMaVaiTro());
        if (!thanhVienVaiTroRepository.existsById(id)) {
            ThanhVienVaiTro tvvt = new ThanhVienVaiTro();
            tvvt.setId(id);
            tvvt.setThanhVienNhom(thanhVien);
            tvvt.setVaiTro(vaiTro);
            thanhVienVaiTroRepository.saveAndFlush(tvvt);
        }
    }
}