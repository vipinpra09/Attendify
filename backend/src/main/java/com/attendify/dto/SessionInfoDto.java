package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfoDto {
    private String date;
    private String classId;
    private String className;
    private String subjectId;
    private String subjectName;
    private String subjectCode;
    private String teacherName;
    private int present;
    private int total;
    private Double percent;
}
