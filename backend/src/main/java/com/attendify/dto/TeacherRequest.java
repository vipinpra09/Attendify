package com.attendify.dto;

import lombok.Data;

@Data
public class TeacherRequest {
    private String name;
    private String email;
    private String password;
    private String department;
    private String phone;
    private String employeeCode;
    private Boolean active;
}
