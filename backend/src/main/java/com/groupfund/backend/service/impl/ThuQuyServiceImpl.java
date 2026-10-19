package com.groupfund.backend.service.impl;

import com.groupfund.backend.dto.*;
import com.groupfund.backend.entity.*;
import com.groupfund.backend.entity.id.NghiaVuThanhVienId;
import com.groupfund.backend.enums.TrangThaiKhoanNop;
import com.groupfund.backend.enums.TrangThaiNghiaVu;
import com.groupfund.backend.enums.TrangThaiThanhVien;
import com.groupfund.backend.repository.*;
import com.groupfund.backend.service.ThuQuyService;
import com.groupfund.backend.util.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class ThuQuyServiceImpl implements ThuQuyService {

    private final NghiaVuDongGopRepository nghiaVuDongGopRepository;
    private final NghiaVuThanhVienRepository nghiaVuThanhVienRepository;
    private final KhoanNopRepository khoanNopRepository;
    private final NhomQuyRepository nhomQuyRepository;
    private final ThanhVienNhomRepository thanhVienNhomRepository;
    private final ChinhSachPheDuyetRepository chinhSachPheDuyetRepository;
    private final SecurityUtils securityUtils;

    @Autowired
    public ThuQuyServiceImpl(
            NghiaVuDongGopRepository nghiaVuDongGopRepository,
            NghiaVuThanhVienRepository nghiaVuThanhVienRepository,
            KhoanNopRepository khoanNopRepository,
            NhomQuyRepository nhomQuyRepository,
            ThanhVienNhomRepository thanhVienNhomRepository,
            ChinhSachPheDuyetRepository chinhSachPheDuyetRepository,
            SecurityUtils securityUtils
    ) {
        this.nghiaVuDongGopRepository = nghiaVuDongGopRepository;
        this.nghiaVuThanhVienRepository = nghiaVuThanhVienRepository;
        this.khoanNopRepository = khoanNopRepository;
        this.nhomQuyRepository = nhomQuyRepository;
        this.thanhVienNhomRepository = thanhVienNhomRepository;
        this.chinhSachPheDuyetRepository = chinhSachPheDuyetRepository;
        this.securityUtils = securityUtils;
    }

    @Override
    @Transactional
    public NghiaVuResponse taoNghiaVuDongGop(TaoNghiaVuRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        NhomQuy nhomQuy = nhomQuyRepository.findById(request.getMaNhom())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        ThanhVienNhom nguoiTao = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(nhomQuy.getMaNhom(), currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không phải thành viên của nhóm này!"));

        NghiaVuDongGop nghiaVu = NghiaVuDongGop.builder()
                .nhomQuy(nhomQuy)
                .nguoiTao(nguoiTao)
                .tenNghiaVu(request.getTenNghiaVu())
                .soTienMacDinh(request.getSoTienMacDinh())
                .hanDong(request.getHanDong() != null ? request.getHanDong() : OffsetDateTime.now().plusDays(7))
                .ghiChu(request.getGhiChu())
                .trangThai(TrangThaiNghiaVu.HOAT_DONG)
                .ngayTao(OffsetDateTime.now())
                .build();
        nghiaVu = nghiaVuDongGopRepository.save(nghiaVu);

        List<ThanhVienNhom> danhSachThanhVien = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndTrangThaiThanhVien(nhomQuy.getMaNhom(), TrangThaiThanhVien.HOAT_DONG);

        for (ThanhVienNhom tv : danhSachThanhVien) {
            NghiaVuThanhVien nvtv = NghiaVuThanhVien.builder()
                    .id(new NghiaVuThanhVienId(nghiaVu.getMaNghiaVu(), tv.getMaThanhVienNhom()))
                    .nghiaVuDongGop(nghiaVu)
                    .thanhVienNhom(tv)
                    .maNhom(nhomQuy.getMaNhom())
                    .soTienPhaiDong(request.getSoTienMacDinh())
                    .ngayGan(OffsetDateTime.now())
                    .build();
            nghiaVuThanhVienRepository.save(nvtv);
        }

        return mapToNghiaVuResponse(nghiaVu);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NghiaVuResponse> layDanhSachNghiaVuByNhom(Long maNhom) {
        List<NghiaVuDongGop> list = nghiaVuDongGopRepository.findByNhomQuy_MaNhomAndTrangThai(maNhom, TrangThaiNghiaVu.HOAT_DONG);
        return list.stream().map(this::mapToNghiaVuResponse).toList();
    }

    @Override
    @Transactional
    public KhoanNopResponse khaiBaoKhoanNop(KhaiBaoKhoanNopRequest request) {
        NguoiDung currentUser = securityUtils.getCurrentUser();
        NhomQuy nhomQuy = nhomQuyRepository.findById(request.getMaNhom())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));

        ThanhVienNhom nguoiKhaiBao = thanhVienNhomRepository
                .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(nhomQuy.getMaNhom(), currentUser.getMaNguoiDung())
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm này!"));

        ThanhVienNhom thuQuyNhan = null;
        if (request.getMaThuQuyNhan() != null) {
            thuQuyNhan = thanhVienNhomRepository.findById(request.getMaThuQuyNhan()).orElse(null);
        }
        if (thuQuyNhan == null) {
            thuQuyNhan = thanhVienNhomRepository
                    .findByNhomQuy_MaNhomAndNguoiDung_MaNguoiDung(nhomQuy.getMaNhom(), nhomQuy.getNguoiTao().getMaNguoiDung())
                    .orElse(nguoiKhaiBao);
        }

        NghiaVuDongGop nghiaVu = request.getMaNghiaVu() != null
                ? nghiaVuDongGopRepository.findById(request.getMaNghiaVu()).orElse(null) : null;

        ChinhSachPheDuyet chinhSach = chinhSachPheDuyetRepository.findByNhomQuy_MaNhom(nhomQuy.getMaNhom()).orElse(null);
        boolean batPheDuyet = chinhSach != null && Boolean.TRUE.equals(chinhSach.getBatPheDuyet());

        TrangThaiKhoanNop trangThaiBanDau = batPheDuyet ? TrangThaiKhoanNop.CHO_XAC_NHAN : TrangThaiKhoanNop.DA_XAC_NHAN;

        // Dynamic phương thức thanh toán truyền từ DTO
        KhoanNop khoanNop = KhoanNop.builder()
                .nhomQuy(nhomQuy)
                .nguoiKhaiBao(nguoiKhaiBao)
                .thuQuyNhan(thuQuyNhan)
                .nghiaVuDongGop(nghiaVu)
                .soTien(request.getSoTien())
                .soTienApDungNghiaVu(nghiaVu != null ? request.getSoTien() : BigDecimal.ZERO)
                .phuongThuc(request.getPhuongThuc()) // Lấy động từ request
                .duongDanMinhChung(request.getDuongDanMinhChung())
                .ghiChu(request.getGhiChu() != null ? request.getGhiChu() : request.getNoiDung())
                .trangThai(trangThaiBanDau)
                .ngayKhaiBao(OffsetDateTime.now())
                .ngayXacNhan(!batPheDuyet ? OffsetDateTime.now() : null)
                .build();

        khoanNop = khoanNopRepository.save(khoanNop);

        if (!batPheDuyet) {
            BigDecimal soDuMoi = nhomQuy.getSoDuHienTai().add(request.getSoTien());
            nhomQuy.setSoDuHienTai(soDuMoi);
            nhomQuyRepository.save(nhomQuy);
        }

        return mapToKhoanNopResponse(khoanNop);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KhoanNopResponse> layKhoanNopChoDuyetByNhom(Long maNhom) {
        List<KhoanNop> list = khoanNopRepository.findByNhomQuy_MaNhomAndTrangThai(maNhom, TrangThaiKhoanNop.CHO_XAC_NHAN);
        return list.stream().map(this::mapToKhoanNopResponse).toList();
    }
    @Override
    @Transactional
    public void xoaDotThu(Long maNghiaVu) {
        NghiaVuDongGop nghiaVu = nghiaVuDongGopRepository.findById(maNghiaVu)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đợt thu quỹ này!"));

        long soKhoanDaNop = khoanNopRepository.countByNghiaVuDongGop_MaNghiaVu(maNghiaVu);
        if (soKhoanDaNop > 0) {
            throw new RuntimeException("Không thể xóa đợt thu này vì đã có thành viên nộp tiền!");
        }

        nghiaVuDongGopRepository.delete(nghiaVu);
    }

    @Override
    @Transactional
    public KhoanNopResponse xacNhanKhoanNop(Long maKhoanNop, XacNhanKhoanNopRequest request) {
        KhoanNop khoanNop = khoanNopRepository.findById(maKhoanNop)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khoản nộp!"));

        TrangThaiKhoanNop trangThaiCu = khoanNop.getTrangThai();
        khoanNop.setTrangThai(request.getTrangThai());
        khoanNop.setNgayXacNhan(OffsetDateTime.now());

        if (request.getTrangThai() == TrangThaiKhoanNop.TU_CHOI) {
            khoanNop.setLyDoTuChoi(request.getLyDoTuChoi());
        }

        // THỦ QUỶ BẤM DUYỆT -> TỰ ĐỘNG CỘNG SỐ DƯ QUỸ
        if (trangThaiCu != TrangThaiKhoanNop.DA_XAC_NHAN && request.getTrangThai() == TrangThaiKhoanNop.DA_XAC_NHAN) {
            NhomQuy nhomQuy = khoanNop.getNhomQuy();
            BigDecimal soDuMoi = (nhomQuy.getSoDuHienTai() != null ? nhomQuy.getSoDuHienTai() : BigDecimal.ZERO).add(khoanNop.getSoTien());
            nhomQuy.setSoDuHienTai(soDuMoi);
            nhomQuyRepository.save(nhomQuy);
        }

        khoanNop = khoanNopRepository.save(khoanNop);
        return mapToKhoanNopResponse(khoanNop);
    }

    private NghiaVuResponse mapToNghiaVuResponse(NghiaVuDongGop nv) {
        return NghiaVuResponse.builder()
                .maNghiaVu(nv.getMaNghiaVu())
                .maNhom(nv.getNhomQuy().getMaNhom())
                .tenNghiaVu(nv.getTenNghiaVu())
                .soTienMacDinh(nv.getSoTienMacDinh())
                .hanDong(nv.getHanDong())
                .ghiChu(nv.getGhiChu())
                .trangThai(nv.getTrangThai())
                .ngayTao(nv.getNgayTao())
                .build();
    }

    private KhoanNopResponse mapToKhoanNopResponse(KhoanNop kn) {
        return KhoanNopResponse.builder()
                .maKhoanNop(kn.getMaKhoanNop())
                .maNhom(kn.getNhomQuy().getMaNhom())
                .tenNguoiKhaiBao(kn.getNguoiKhaiBao().getNguoiDung().getHoTen())
                .tenThuQuyNhan(kn.getThuQuyNhan().getNguoiDung().getHoTen())
                .maNghiaVu(kn.getNghiaVuDongGop() != null ? kn.getNghiaVuDongGop().getMaNghiaVu() : null)
                .soTien(kn.getSoTien())
                .phuongThuc(kn.getPhuongThuc())
                .duongDanMinhChung(kn.getDuongDanMinhChung())
                .ghiChu(kn.getGhiChu())
                .trangThai(kn.getTrangThai())
                .ngayKhaiBao(kn.getNgayKhaiBao())
                .ngayXacNhan(kn.getNgayXacNhan())
                .lyDoTuChoi(kn.getLyDoTuChoi())
                .build();
    }
}