package com.attendify.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DayStatDto {
    private String date;
    private int present;
    private int total;
    private Double percent;
    @JsonProperty("isToday")
    private boolean isToday;
}
