package com.attendify.controller;

import com.attendify.dto.TeacherDto;
import com.attendify.dto.TeacherRequest;
import com.attendify.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping
    public List<TeacherDto> list() {
        return teacherService.list();
    }

    @GetMapping("/{id}")
    public TeacherDto get(@PathVariable String id) {
        return teacherService.get(id);
    }

    @PostMapping
    public TeacherDto create(@RequestBody TeacherRequest request) {
        return teacherService.create(request);
    }

    @PutMapping("/{id}")
    public TeacherDto update(@PathVariable String id, @RequestBody TeacherRequest request) {
        return teacherService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable String id) {
        teacherService.remove(id);
    }
}
