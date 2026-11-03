package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ThanhVienVaiTro")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ThanhVienVaiTro {

    @EmbeddedId
    private ThanhVienVaiTroId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("thanhVienId")
    @JoinColumn(name = "thanhVienId", nullable = false)
    private ThanhVienNhom thanhVienNhom;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("vaiTroId")
    @JoinColumn(name = "vaiTroId", nullable = false)
    private VaiTro vaiTro;
}