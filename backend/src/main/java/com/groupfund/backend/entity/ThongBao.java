package com.groupfund.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "\"ThongBao\"")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ThongBao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "\"maThongBao\"")
    private Long maThongBao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"nhomId\"", nullable = false)
    private NhomQuy nhomQuy;

    @Column(name = "\"tieuDe\"", nullable = false, length = 200)
    private String tieuDe;

    @Column(name = "\"noiDung\"", nullable = false, columnDefinition = "TEXT")
    private String noiDung;

    @Column(name = "\"loaiThongBao\"", nullable = false, length = 50)
    private String loaiThongBao;

    @Column(name = "\"ngayTao\"", insertable = false, updatable = false)
    private OffsetDateTime ngayTao;
}