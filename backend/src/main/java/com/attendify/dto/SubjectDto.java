package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectDto {
    private String id;
    private String name;
    private String code;
    private String department;
    private int semester;
    private String teacherId;
    private String teacherName;
    private String subjectType;
    private String employeeCode;
    private String teacherDepartment;
}
