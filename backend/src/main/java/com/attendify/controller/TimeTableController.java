package com.attendify.controller;

import com.attendify.dto.TimeTableDto;
import com.attendify.service.TimeTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
public class TimeTableController {

    private final TimeTableService timeTableService;

    @GetMapping
    public TimeTableDto.ResponseDto getTimeTable(@RequestParam(required = false) String classId) {
        return timeTableService.getTimeTable(classId);
    }

    @GetMapping("/{classId}")
    public TimeTableDto.ResponseDto getTimeTableByPath(@PathVariable String classId) {
        return timeTableService.getTimeTable(classId);
    }
}
