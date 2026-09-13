package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSummaryDto {
    private String studentId;
    private String enrollmentNo;
    private String name;
    private String className;
    private int total;
    private int attended;
    private Double percent;
    private int needed;
}
