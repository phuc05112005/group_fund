package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "\"YeuCauThamGia\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class YeuCauThamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maYeuCau\"")
    private Long maYeuCau;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nguoiDungId\"", nullable = false)
    private NguoiDung nguoiDung;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nhomId\"", nullable = false)
    private NhomQuy nhomQuy;

    @Column(name = "ly_do_note", columnDefinition = "text")
    private String lyDoNote;

    @Column(name = "\"trangThai\"", length = 30)
    private String trangThai = "CHO_DUYET";

    @Column(name = "\"ngayTao\"", insertable = false, updatable = false)
    private OffsetDateTime ngayTao;
}