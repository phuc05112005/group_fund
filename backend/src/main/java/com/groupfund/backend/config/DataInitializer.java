package com.groupfund.backend.config;

import com.groupfund.backend.entity.VaiTro;
import com.groupfund.backend.repository.VaiTroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final VaiTroRepository vaiTroRepository;

    @Override
    public void run(String... args) {
        // Chỉ khởi tạo 2 vai trò chức năng trong hệ thống
        taoVaiTroNeuChuaTonTai("QUAN_TRI", "Quản trị viên nhóm - Quản lý thành viên, phê duyệt yêu cầu và thiết lập nhóm");
        taoVaiTroNeuChuaTonTai("THU_QUY", "Thủ quỹ - Quản lý dòng tiền, xác nhận thu/chi và bàn giao quỹ");
    }

    private void taoVaiTroNeuChuaTonTai(String tenVaiTro, String moTa) {
        if (!vaiTroRepository.existsByTenVaiTro(tenVaiTro)) {
            VaiTro vaiTro = new VaiTro();
            vaiTro.setTenVaiTro(tenVaiTro);
            vaiTro.setMoTa(moTa);
            vaiTroRepository.save(vaiTro);
        }
    }
}