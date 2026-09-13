package com.attendify.dto;

import lombok.Data;

@Data
public class SubjectRequest {
    private String name;
    private String code;
    private String department;
    private Integer semester;
    private String teacherId;
    private String subjectType;
}
