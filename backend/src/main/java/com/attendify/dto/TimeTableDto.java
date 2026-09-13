package com.attendify.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class TimeTableDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntryDto {
        private String id;
        private String dayOfWeek;
        private int slotIndex;
        private String timeSlot;
        private String subjectCode;
        private String subjectName;
        private String subjectType;
        private String teacherName;
        private String employeeCode;
        private String department;
        private String groupType;
        private String splitDisplay;
        private boolean isBreak;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DirectoryItemDto {
        private int sNo;
        private String subjectType;
        private String subjectName;
        private String subjectCode;
        private String employeeCode;
        private String employeeName;
        private String departmentName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResponseDto {
        private String classId;
        private String className;
        private String branch;
        private int semester;
        private String section;
        private String studentName;
        private String rollNo;
        private String registrationDate;
        private List<EntryDto> entries;
        private List<DirectoryItemDto> directory;
    }
}
