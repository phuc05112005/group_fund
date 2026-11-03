package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "\"NhanThongBao\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class NhanThongBao {

    @EmbeddedId
    private NhanThongBaoId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("thanhVienId")
    @JoinColumn(name = "\"thanhVienId\"")
    private ThanhVienNhom thanhVienNhom;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("thongBaoId")
    @JoinColumn(name = "\"thongBaoId\"")
    private ThongBao thongBao;

    @Column(name = "\"daDoc\"")
    private Boolean daDoc = false;
}