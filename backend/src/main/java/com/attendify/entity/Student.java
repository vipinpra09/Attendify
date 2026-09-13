package com.attendify.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true)
    private String enrollmentNo;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String branch;

    @Column(nullable = false)
    private int semester;

    @Column(nullable = false)
    private String section;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id")
    private CollegeClass collegeClass;

    @Column(nullable = false)
    private boolean active;
}
