package com.attendify.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "college_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollegeClass {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String branch;

    @Column(nullable = false)
    private int semester;

    @Column(nullable = false)
    private String section;

    @Column(nullable = false)
    private String academicYear;
}
