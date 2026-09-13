package com.attendify.controller;

import com.attendify.dto.ReportResultDto;
import com.attendify.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/attendance")
    public ReportResultDto attendance(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String subjectId,
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        return reportService.generate(type == null ? "daily" : type, date, month, classId, subjectId, studentId, from, to);
    }

    @GetMapping("/low-attendance")
    public ReportResultDto lowAttendance(
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) String subjectId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        return reportService.generate("low", null, null, classId, subjectId, null, from, to);
    }
}
