package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollegeClassDto {
    private String id;
    private String name;
    private String branch;
    private int semester;
    private String section;
    private String academicYear;
    private Integer studentCount;
    private Integer subjectCount;
}
