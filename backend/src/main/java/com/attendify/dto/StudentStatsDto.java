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
public class StudentStatsDto {
    private Overall overall;
    private List<SubjectSummaryDto> subjects;
    private int lowCount;
    private List<TrendPointDto> trend;
    private List<AttendanceRecordDto> recent;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Overall {
        private int total;
        private int attended;
        private int missed;
        private Double percent;
    }
}
