package com.attendify.controller;

import com.attendify.dto.*;
import com.attendify.enums.AttendanceStatus;
import com.attendify.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/session")
    public SessionLookupResponse getSession(
            @RequestParam String classId,
            @RequestParam String subjectId,
            @RequestParam String date
    ) {
        return attendanceService.getSession(classId, subjectId, date);
    }

    @PostMapping
    public SaveSessionResponse saveSession(@RequestBody SaveSessionRequest request) {
        return attendanceService.saveSession(request);
    }

    @PutMapping("/{id}")
    public AttendanceRecordDto update(
            @PathVariable String id,
            @RequestBody UpdateAttendanceRequest request
    ) {
        return attendanceService.updateRecord(id, request.getStatus());
    }

    @GetMapping
    public PagedResponse<AttendanceRecordDto> query(
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String subjectId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return attendanceService.query(classId, subjectId, studentId, status, from, to, query, page, size);
    }
}
