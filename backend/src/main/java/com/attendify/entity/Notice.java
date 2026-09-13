package com.attendify.entity;

import com.attendify.enums.NoticeTargetType;
import com.attendify.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "notices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {

    @Id
    @Column(length = 96)
    private String id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NoticeTargetType targetType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_class_id")
    private CollegeClass targetClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_student_id")
    private Student targetStudent;

    @Column(length = 20)
    private String priority;

    @Column(nullable = false, length = 96)
    private String postedById;

    @Column(nullable = false, length = 120)
    private String postedByName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role postedByRole;

    @Column(nullable = false)
    private Instant createdAt;
}
