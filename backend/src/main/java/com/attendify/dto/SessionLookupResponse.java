package com.attendify.dto;

import com.attendify.enums.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionLookupResponse {
    private List<StudentBrief> students;
    private Map<String, ExistingMark> existing;
    private boolean editable;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentBrief {
        private String id;
        private String enrollmentNo;
        private String name;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExistingMark {
        private AttendanceStatus status;
        private String recordId;
    }
}
