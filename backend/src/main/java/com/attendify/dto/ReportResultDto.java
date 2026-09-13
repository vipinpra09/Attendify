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
public class ReportResultDto {
    private String type;
    private String title;
    private List<SummaryItem> summary;
    private List<String> columns;
    private List<List<Object>> rows;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryItem {
        private String label;
        private String value;
    }
}
