package com.attendify.dto;

import lombok.Data;

@Data
public class StudentRequest {
    private String enrollmentNo;
    private String name;
    private String email;
    private String password;
    private String phone;
    private String branch;
    private Integer semester;
    private String section;
    private String classId;
    private Boolean active;
}
