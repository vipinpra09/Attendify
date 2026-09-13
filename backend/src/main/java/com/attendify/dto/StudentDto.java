package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDto {
    private String id;
    private String enrollmentNo;
    private String name;
    private String email;
    private String phone;
    private String branch;
    private int semester;
    private String section;
    private String classId;
    private boolean active;
    private String className;
    private Double percent;
}
