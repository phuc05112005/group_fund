package com.groupfund.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;
import java.io.Serializable;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class NhanThongBaoId implements Serializable {

    @Column(name = "\"thanhVienId\"")
    private Long thanhVienId;

    @Column(name = "\"thongBaoId\"")
    private Long thongBaoId;
}