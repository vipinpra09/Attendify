package com.attendify.dto;

import com.attendify.enums.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordDto {
    private String id;
    private String studentId;
    private String subjectId;
    private String teacherId;
    private String classId;
    private String date;
    private AttendanceStatus status;
    private String createdAt;
    private String updatedAt;
    private String enrollmentNo;
    private String studentName;
    private String subjectName;
    private String subjectCode;
    private String className;
    private String teacherName;
}
