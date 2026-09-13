package com.attendify.dto;

import lombok.Data;

@Data
public class CollegeClassRequest {
    private String name;
    private String branch;
    private Integer semester;
    private String section;
    private String academicYear;
}
