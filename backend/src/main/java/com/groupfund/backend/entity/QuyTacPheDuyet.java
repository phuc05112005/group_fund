package com.groupfund.backend.entity;

import com.groupfund.backend.enums.KieuDieuKien;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "QUY_TAC_PHE_DUYET")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class QuyTacPheDuyet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_quy_tac")
    private Long maQuyTac;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_chinh_sach", nullable = false)
    private ChinhSachPheDuyet chinhSachPheDuyet;

    @Column(name = "tu_so_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal tuSoTien = BigDecimal.ZERO;

    @Column(name = "den_so_tien", precision = 15, scale = 2)
    private BigDecimal denSoTien;

    @Enumerated(EnumType.STRING)
    @Column(name = "kieu_dieu_kien", nullable = false, length = 20)
    private KieuDieuKien kieuDieuKien;

    @Column(name = "so_nguoi_dong_y_toi_thieu")
    private Integer soNguoiDongYToiThieu;

    @Column(name = "ty_le_dong_y_toi_thieu", precision = 5, scale = 2)
    private BigDecimal tyLeDongYToiThieu;
}