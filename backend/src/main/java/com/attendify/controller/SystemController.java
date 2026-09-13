package com.attendify.controller;

import com.attendify.dto.ExportResponse;
import com.attendify.service.SystemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemService systemService;

    @PostMapping("/reset-demo")
    public void resetDemo() {
        systemService.resetDemo();
    }

    @PostMapping("/export")
    public ExportResponse exportAll() {
        return systemService.exportAll();
    }
}
