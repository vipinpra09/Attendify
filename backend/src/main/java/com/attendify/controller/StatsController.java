package com.attendify.controller;

import com.attendify.dto.AdminStatsDto;
import com.attendify.dto.StudentStatsDto;
import com.attendify.dto.TeacherStatsDto;
import com.attendify.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/admin")
    public AdminStatsDto admin() {
        return statsService.admin();
    }

    @GetMapping("/teacher")
    public TeacherStatsDto teacher() {
        return statsService.teacher();
    }

    @GetMapping("/student")
    public StudentStatsDto student() {
        return statsService.student();
    }
}
