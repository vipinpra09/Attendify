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
public class TeacherStatsDto {
    private List<SubjectSummaryDto> subjects;
    private List<String> classIds;
    private int totalStudents;
    private DayStatDto today;
    private Double averagePercent;
    private List<SessionInfoDto> recentSessions;
}
