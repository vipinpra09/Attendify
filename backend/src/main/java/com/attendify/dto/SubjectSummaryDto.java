package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectSummaryDto {
    private String subjectId;
    private String name;
    private String code;
    private String teacherName;
    private int total;
    private int attended;
    private Double percent;
    private String subjectType;
    private String employeeCode;
    private String teacherDepartment;
}
