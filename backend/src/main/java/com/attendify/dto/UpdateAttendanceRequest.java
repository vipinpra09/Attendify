package com.attendify.dto;

import com.attendify.enums.AttendanceStatus;
import lombok.Data;

@Data
public class UpdateAttendanceRequest {
    private AttendanceStatus status;
}
