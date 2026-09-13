package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private int students;
    private int teachers;
    private int subjects;
    private int classes;
    private DayStatDto today;
    private Double averagePercent;
    private int presentTotal;
    private int absentTotal;
    private List<StudentSummaryDto> lowStudents;
    private List<SubjectSummaryDto> subjectwise;
    private List<TrendPointDto> trend;
    private List<SessionInfoDto> sessions;
}
