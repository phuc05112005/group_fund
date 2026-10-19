package com.groupfund.backend.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
public class ChinhSachNguoiBieuQuyetId implements Serializable {
    @Column(name = "ma_chinh_sach")
    private Long maChinhSach;

    @Column(name = "ma_thanh_vien_nhom")
    private Long maThanhVienNhom;
}