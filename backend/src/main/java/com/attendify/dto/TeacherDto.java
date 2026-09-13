package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDto {
    private String id;
    private String name;
    private String email;
    private String department;
    private String phone;
    private boolean active;
    private Integer subjectCount;
    private String employeeCode;
}
