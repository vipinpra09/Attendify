package com.attendify.dto;

import com.attendify.enums.AttendanceStatus;
import lombok.Data;

import java.util.List;

@Data
public class SaveSessionRequest {
    private String classId;
    private String subjectId;
    private String date;
    private List<RecordItem> records;

    @Data
    public static class RecordItem {
        private String studentId;
        private AttendanceStatus status;
    }
}
