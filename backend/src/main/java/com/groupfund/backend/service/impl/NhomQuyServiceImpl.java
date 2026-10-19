package com.groupfund.backend.service.impl;

import com.groupfund.backend.dto.*;
import com.groupfund.backend.entity.*;
import com.groupfund.backend.entity.id.ThanhVienVaiTroId;
import com.groupfund.backend.enums.CheDoRiengTu;
import com.groupfund.backend.enums.TrangThaiNhom;
import com.groupfund.backend.enums.TrangThaiThanhVien;
import com.groupfund.backend.repository.*;
import com.groupfund.backend.service.NhomQuyService;
import com.groupfund.backend.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class NhomQuyServiceImpl implements NhomQuyService {

    private final NhomQuyRepository nhomQuyRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final VaiTroRepository vaiTroRepository;
    private final ThanhVienVaiTroRepository thanhVienVaiTroRepository;
    private final ChinhSachPheDuyetRepository chinhSachPheDuyetRepository;
    private final KhoanNopRepository khoanNopRepository;
    private final KhoanChiRepository khoanChiRepository;
    private final SecurityUtils securityUtils;

    @Autowired
    public NhomQuyServiceImpl(
            NhomQuyRepository nhomQuyRepository,
            ThanhVienNhomRepository thanhVienNhomRepository,
            VaiTroRepository vaiTroRepository,
            ThanhVienVaiTroRepository thanhVienVaiTroRepository,
            ChinhSachPheDuyetRepository chinhSachPheDuyetRepository,
            KhoanNopRepository khoanNopRepository,
            KhoanChiRepository khoanChiRepository,
            SecurityUtils securityUtils
    ) {
        this.nhomQuyRepository = nhomQuyRepository;
        this.thanhVienNhomRepository = thanhVienNhomRepository;
        this.vaiTroRepository = vaiTroRepository;
        this.thanhVienVaiTroRepository = thanhVienVaiTroRepository;
        this.chinhSachPheDuyetRepository = chinhSachPheDuyetRepository;
        this.khoanNopRepository = khoanNopRepository;
        this.khoanChiRepository = khoanChiRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional
    public NhomQuyResponse taoNhom(TaoNhomRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();

        // 1. Sinh mã tham gia 8 ký tự tự động
        String maCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 2. Tạo đối tượng Nhóm Quỹ
        NhomQuy nhomQuy = NhomQuy.builder()
                .nguoiTao(currentUser)
                .tenNhom(request.getTenNhom())
                .moTa(request.getMoTa())
                .loaiTienTe(request.getLoaiTienTe() != null ? request.getLoaiTienTe() : "VND")
                .cheDoRiengTu(request.getCheDoRiengTu() != null ? request.getCheDoRiengTu() : CheDoRiengTu.RIENG_TU)
                .maThamGia(maCode)
                .mucTieuQuy(request.getMucTieuQuy()) // Chấp nhận NULL
                .soDuHienTai(BigDecimal.ZERO)
                .trangThai(TrangThaiNhom.HOAT_DONG)
                .ngayTao(OffsetDateTime.now())
                .build();

        NhomQuy nhomQuySaved = nhomQuyRepository.save(nhomQuy);

        // 3. Tự động thêm Người tạo thành Quản trị viên (ADMIN)
        ThanhVienNhom tvAdmin = ThanhVienNhom.builder()
                .nhomQuy(nhomQuySaved)
                .nguoiDung(currentUser)
                .trangThaiThanhVien(TrangThaiThanhVien.HOAT_DONG)
                .ngayThamGia(OffsetDateTime.now())
                .build();
        ThanhVienNhom tvSaved = thanhVienNhomRepository.save(tvAdmin);

        VaiTro roleAdmin = vaiTroRepository.findByTenVaiTro("ADMIN")
                .orElseGet(() -> vaiTroRepository.save(VaiTro.builder().tenVaiTro("ADMIN").moTa("Quản trị").build()));

        ThanhVienVaiTro tvvt = ThanhVienVaiTro.builder()
                .thanhVienNhom(tvSaved)
                .vaiTro(roleAdmin)
                .ngayGan(OffsetDateTime.now())
                .build();
        thanhVienVaiTroRepository.save(tvvt);

        // 4. Tạo Chính sách phê duyệt ban đầu cho Nhóm
        ChinhSachPheDuyet chinhSach = ChinhSachPheDuyet.builder()
                .nhomQuy(nhomQuySaved)
                .batPheDuyet(request.getBatPheDuyet() != null ? request.getBatPheDuyet() : true)
                .batBieuQuyet(request.getBatBieuQuyet() != null ? request.getBatBieuQuyet() : false)
                .phamViBieuQuyet("TOAN_BO_THANH_VIEN")
                .thoiHanBieuQuyetGio(request.getThoiHanBieuQuyetGio() != null ? request.getThoiHanBieuQuyetGio() : 24)
                .ngayCapNhat(OffsetDateTime.now())
                .build();
        chinhSachPheDuyetRepository.save(chinhSach);

        return mapToResponse(nhomQuySaved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NhomQuyResponse> layDanhSachNhomCuaToi() {
        NguoiDung currentUser = securityUtils.getCurrentUser();

        // 1. Lấy tất cả bản ghi liên kết thành viên của user hiện tại
        List<ThanhVienNhom> listThanhVien = thanhVienNhomRepository
                .findByNguoiDung_MaNguoiDung(currentUser.getMaNguoiDung());

        if (listThanhVien == null || listThanhVien.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Lọc lấy các nhóm mà thành viên còn đang HOAT_DONG và nhóm đang HOAT_DONG
        return listThanhVien.stream()
                .filter(tv -> tv.getTrangThaiThanhVien() == null || tv.getTrangThaiThanhVien() == TrangThaiThanhVien.HOAT_DONG)
                .map(ThanhVienNhom::getNhomQuy)
                .filter(nhom -> nhom != null && (nhom.getTrangThai() == null || nhom.getTrangThai() == TrangThaiNhom.HOAT_DONG))
                .map(this::mapToResponse)
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    @Transactional
    public void capNhatChinhSach(Long maNhom, CapNhatNhomRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();

        ThanhVienNhom tv = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(maNhom, currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        List<ThanhVienVaiTro> vaiTros = thanhVienVaiTroRepository
                .findByThanhVienNhom_MaThanhVienNhom(tv.getMaThanhVienNhom());

        boolean isAdmin = vaiTros.stream().anyMatch(v -> "ADMIN".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()));
        if (!isAdmin) {
            throw new RuntimeException("Chỉ Quản trị viên mới có quyền thay đổi cấu hình nhóm!");
        }

        NhomQuy nhomQuy = tv.getNhomQuy();
        if (request.getTenNhom() != null && !request.getTenNhom().isBlank()) {
            nhomQuy.setTenNhom(request.getTenNhom());
        }
        if (request.getMoTa() != null) {
            nhomQuy.setMoTa(request.getMoTa());
        }
        if (request.getCheDoRiengTu() != null) {
            nhomQuy.setCheDoRiengTu(request.getCheDoRiengTu());
        }
        nhomQuy.setMucTieuQuy(request.getMucTieuQuy());
        nhomQuyRepository.save(nhomQuy);

        ChinhSachPheDuyet chinhSach = chinhSachPheDuyetRepository.findByNhomQuy_MaNhom(maNhom)
                .orElseGet(() -> ChinhSachPheDuyet.builder().nhomQuy(nhomQuy).build());

        boolean batPheDuyet = request.getBatPheDuyet() != null ? request.getBatPheDuyet() : true;
        chinhSach.setBatPheDuyet(batPheDuyet);
        chinhSach.setBatBieuQuyet(batPheDuyet && request.getBatBieuQuyet() != null ? request.getBatBieuQuyet() : false);
        if (request.getThoiHanBieuQuyetGio() != null) {
            chinhSach.setThoiHanBieuQuyetGio(request.getThoiHanBieuQuyetGio());
        }
        chinhSach.setNgayCapNhat(OffsetDateTime.now());
        chinhSachPheDuyetRepository.save(chinhSach);
    }

    @Override
    @Transactional(readOnly = true)
    public NhomQuyResponse layChiTietNhom(Long maNhom) {
        NhomQuy nhomQuy = nhomQuyRepository.findById(maNhom)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
        return mapToResponse(nhomQuy);
    }

    @Override
    @Transactional
    public NhomQuyResponse thamGiaBangMaCode(String maThamGia) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        NhomQuy nhomQuy = nhomQuyRepository.findByMaThamGia(maThamGia)
                .orElseThrow(() -> new RuntimeException("Mã tham gia không chính xác!"));

        boolean daLaThanhVien = thanhVienNhomRepository
                .existsByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(nhomQuy.getMaNhom(), currentUser.getMaNguoiDung());

        if (daLaThanhVien) {
            throw new RuntimeException("Bạn đã là thành viên của nhóm này rồi!");
        }

        ThanhVienNhom thanhVien = ThanhVienNhom.builder()
                .nhomQuy(nhomQuy)
                .nguoiDung(currentUser)
                .trangThaiThanhVien(TrangThaiThanhVien.HOAT_DONG)
                .ngayThamGia(OffsetDateTime.now())
                .build();
        thanhVienNhomRepository.save(thanhVien);

        VaiTro vaiTroMember = vaiTroRepository.findByTenVaiTro("MEMBER")
                .orElseGet(() -> vaiTroRepository.save(
                        VaiTro.builder().tenVaiTro("MEMBER").moTa("Thành viên nhóm").build()
                ));

        ThanhVienVaiTro thanhVienVaiTro = new ThanhVienVaiTro();
        thanhVienVaiTro.setId(new ThanhVienVaiTroId(thanhVien.getMaThanhVienNhom(), vaiTroMember.getMaVaiTro()));
        thanhVienVaiTro.setThanhVienNhom(thanhVien);
        thanhVienVaiTro.setVaiTro(vaiTroMember);
        thanhVienVaiTro.setNgayGan(OffsetDateTime.now());
        thanhVienVaiTroRepository.save(thanhVienVaiTro);

        return mapToResponse(nhomQuy);
    }

    // 5. ĐÓNG NHÓM QUỸ - YÊU CẦU QUYỀN ADMIN CHUẨN XÁC
    @Override
    @Transactional
    public void dongNhomQuy(Long maNhom) {
        NguoiDung currentUser = securityUtils.getCurrentUser();

        ThanhVienNhom tv = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(maNhom, currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        // RÀO CHẮN BẢO MẬT: Bắt buộc người thực hiện phải có vai trò ADMIN
        List<ThanhVienVaiTro> vaiTros = thanhVienVaiTroRepository
                .findByThanhVienNhom_MaThanhVienNhom(tv.getMaThanhVienNhom());

        boolean isAdmin = vaiTros != null && vaiTros.stream()
                .anyMatch(v -> v.getVaiTro() != null && "ADMIN".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()));

        if (!isAdmin) {
            throw new RuntimeException("Chỉ Quản trị viên (ADMIN) mới có quyền đóng nhóm quỹ này!");
        }

        NhomQuy nhomQuy = tv.getNhomQuy();
        nhomQuy.setTrangThai(TrangThaiNhom.DA_DONG);
        nhomQuy.setNgayDong(OffsetDateTime.now());
        nhomQuyRepository.save(nhomQuy);
    }

    // 6. RỜI NHÓM CẬP NHẬT CHUẨN XÁC
    @Override
    @Transactional
    public void roiNhomQuy(Long maNhom) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        ThanhVienNhom tv = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(maNhom, currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên của nhóm này!"));

        NhomQuy nhomQuy = tv.getNhomQuy();

        long soThanhVienAct = thanhVienNhomRepository
                .countByNhomQuy_MaNhomAndTrangThaiThanhVien(maNhom, TrangThaiThanhVien.HOAT_DONG);

        if (soThanhVienAct <= 1) {
            tv.setTrangThaiThanhVien(TrangThaiThanhVien.DA_ROI);
            tv.setNgayRoiNhom(OffsetDateTime.now()); // 👉 BỔ SUNG NGÀY RỜI NHÓM
            thanhVienNhomRepository.save(tv);

            nhomQuy.setTrangThai(TrangThaiNhom.DA_DONG);
            nhomQuy.setNgayDong(OffsetDateTime.now());
            nhomQuyRepository.save(nhomQuy);
            return;
        }

        List<ThanhVienVaiTro> listVaiTro = thanhVienVaiTroRepository
                .findByThanhVienNhom_MaThanhVienNhom(tv.getMaThanhVienNhom());

        boolean isAdmin = listVaiTro != null && listVaiTro.stream()
                .anyMatch(v -> v.getVaiTro() != null && "ADMIN".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()));

        boolean isThuQuy = listVaiTro != null && listVaiTro.stream()
                .anyMatch(v -> v.getVaiTro() != null && "THU_QUY".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()));

        if (isAdmin) {
            long countAdmins = thanhVienVaiTroRepository.countByVaiTro_TenVaiTroAndThanhVienNhom_NhomQuy_MaNhom("ADMIN", maNhom);
            if (countAdmins <= 1) {
                throw new RuntimeException("Bạn là Quản trị viên duy nhất. Vui lòng chuyển quyền Admin cho thành viên khác trước khi rời nhóm!");
            }
        }

        if (isThuQuy) {
            if (nhomQuy.getSoDuHienTai() != null && nhomQuy.getSoDuHienTai().compareTo(BigDecimal.ZERO) > 0) {
                throw new RuntimeException("Bạn đang giữ vai trò Thủ quỹ. Vui lòng chuyển giao số dư quỹ cho thủ quỹ khác trước khi rời nhóm!");
            }
        }

        tv.setTrangThaiThanhVien(TrangThaiThanhVien.DA_ROI);
        tv.setNgayRoiNhom(OffsetDateTime.now());
        thanhVienNhomRepository.save(tv);
    }

    // 7. PHÂN NHIỀU VAI TRÒ DẠNG CHECKBOX MULTI-ROLE
    @Override
    @Transactional
    public void ganDaVaiTro(Long maNhom, PhanVaiTroMultiRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        ThanhVienNhom callerMember = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(maNhom, currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        List<ThanhVienVaiTro> callerRoles = thanhVienVaiTroRepository
                .findByThanhVienNhom_MaThanhVienNhom(callerMember.getMaThanhVienNhom());

        boolean isCallerAdmin = callerRoles != null && callerRoles.stream()
                .anyMatch(v -> v.getVaiTro() != null && "ADMIN".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()));

        if (!isCallerAdmin) {
            throw new RuntimeException("Chỉ Quản trị viên (ADMIN) mới có quyền gán hoặc phân lại vai trò cho thành viên!");
        }

        ThanhVienNhom targetMember = thanhVienNhomRepository.findById(request.getMaThanhVienNhom())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên!"));

        if (!targetMember.getNhomQuy().getMaNhom().equals(maNhom)) {
            throw new RuntimeException("Thành viên này không thuộc nhóm hiện tại!");
        }

        List<String> vaiTrosMoi = request.getDanhSachVaiTro() != null ? request.getDanhSachVaiTro() : List.of();

        List<ThanhVienVaiTro> vaiTrosHienTai = thanhVienVaiTroRepository
                .findByThanhVienNhom_MaThanhVienNhom(targetMember.getMaThanhVienNhom());

        boolean dangLaAdmin = vaiTrosHienTai != null && vaiTrosHienTai.stream()
                .anyMatch(v -> v.getVaiTro() != null && "ADMIN".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()));

        boolean dangLaThuQuy = vaiTrosHienTai != null && vaiTrosHienTai.stream()
                .anyMatch(v -> v.getVaiTro() != null && "THU_QUY".equalsIgnoreCase(v.getVaiTro().getTenVaiTro()));

        boolean muonLaAdmin = vaiTrosMoi.contains("ADMIN");
        boolean muonLaThuQuy = vaiTrosMoi.contains("THU_QUY");

        if (dangLaAdmin && !muonLaAdmin) {
            long countAdmins = thanhVienVaiTroRepository.countByVaiTro_TenVaiTroAndThanhVienNhom_NhomQuy_MaNhom("ADMIN", maNhom);
            if (countAdmins <= 1) {
                throw new RuntimeException("Không thể gỡ vai trò Admin! Nhóm bắt buộc phải có ít nhất một Quản trị viên.");
            }
        }

        if (dangLaThuQuy && !muonLaThuQuy) {
            if (targetMember.getNhomQuy().getSoDuHienTai() != null && targetMember.getNhomQuy().getSoDuHienTai().compareTo(BigDecimal.ZERO) > 0) {
                throw new RuntimeException("Không thể hủy vai trò Thủ quỹ khi thành viên này đang chịu trách nhiệm giữ số dư quỹ!");
            }
        }

        if (vaiTrosHienTai != null && !vaiTrosHienTai.isEmpty()) {
            thanhVienVaiTroRepository.deleteAll(vaiTrosHienTai);
        }

        for (String tenVT : vaiTrosMoi) {
            VaiTro vt = vaiTroRepository.findByTenVaiTro(tenVT)
                    .orElseGet(() -> vaiTroRepository.save(VaiTro.builder().tenVaiTro(tenVT).moTa("Vai trò " + tenVT).build()));

            ThanhVienVaiTro tvvt = new ThanhVienVaiTro();
            tvvt.setId(new ThanhVienVaiTroId(targetMember.getMaThanhVienNhom(), vt.getMaVaiTro()));
            tvvt.setThanhVienNhom(targetMember);
            tvvt.setVaiTro(vt);
            tvvt.setNgayGan(OffsetDateTime.now());
            thanhVienVaiTroRepository.save(tvvt);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ThanhVienResponse> layDanhSachThanhVien(Long maNhom) {
        List<ThanhVienNhom> danhSachThanhVien = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndTrangThaiThanhVien(maNhom, TrangThaiThanhVien.HOAT_DONG);

        return danhSachThanhVien.stream().map(tv -> {
            List<ThanhVienVaiTro> vaiTros = thanhVienVaiTroRepository
                    .findByThanhVienNhom_MaThanhVienNhom(tv.getMaThanhVienNhom());

            List<String> danhSachTenVaiTro = vaiTros != null ? vaiTros.stream()
                    .map(v -> v.getVaiTro() != null ? v.getVaiTro().getTenVaiTro() : null)
                    .filter(Objects::nonNull)
                    .toList() : List.of();

            String tenVaiTroChinh = danhSachTenVaiTro.isEmpty() ? "MEMBER" : danhSachTenVaiTro.get(0);

            return ThanhVienResponse.builder()
                    .maThanhVienNhom(tv.getMaThanhVienNhom())
                    .maNguoiDung(tv.getNguoiDung().getMaNguoiDung())
                    .tenNguoiDung(tv.getNguoiDung().getHoTen())
                    .hoTen(tv.getNguoiDung().getHoTen())
                    .tenVaiTro(tenVaiTroChinh)
                    .danhSachVaiTro(danhSachTenVaiTro)
                    .build();
        }).toList();
    }

    private NhomQuyResponse mapToResponse(NhomQuy nhomQuy) {
        if (nhomQuy == null) return null;

        Long maNguoiTao = null;
        String tenNguoiTao = null;
        if (nhomQuy.getNguoiTao() != null) {
            maNguoiTao = nhomQuy.getNguoiTao().getMaNguoiDung();
            tenNguoiTao = nhomQuy.getNguoiTao().getHoTen();
        }

        return NhomQuyResponse.builder()
                .maNhom(nhomQuy.getMaNhom())
                .tenNhom(nhomQuy.getTenNhom())
                .moTa(nhomQuy.getMoTa())
                .loaiTienTe(nhomQuy.getLoaiTienTe() != null ? nhomQuy.getLoaiTienTe() : "VND")
                .cheDoRiengTu(nhomQuy.getCheDoRiengTu() != null ? nhomQuy.getCheDoRiengTu() : CheDoRiengTu.RIENG_TU)
                .maThamGia(nhomQuy.getMaThamGia())
                .mucTieuQuy(nhomQuy.getMucTieuQuy())
                .soDuHienTai(nhomQuy.getSoDuHienTai() != null ? nhomQuy.getSoDuHienTai() : BigDecimal.ZERO)
                .trangThai(nhomQuy.getTrangThai() != null ? nhomQuy.getTrangThai() : TrangThaiNhom.HOAT_DONG)
                .ngayTao(nhomQuy.getNgayTao())
                .maNguoiTao(maNguoiTao)
                .tenNguoiTao(tenNguoiTao)
                .build();
    }
}