package com.attendify.controller;

import com.attendify.dto.StudentDto;
import com.attendify.dto.StudentRequest;
import com.attendify.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public List<StudentDto> list() {
        return studentService.list();
    }

    @GetMapping("/{id}")
    public StudentDto get(@PathVariable String id) {
        return studentService.get(id);
    }

    @PostMapping
    public StudentDto create(@RequestBody StudentRequest request) {
        return studentService.create(request);
    }

    @PutMapping("/{id}")
    public StudentDto update(@PathVariable String id, @RequestBody StudentRequest request) {
        return studentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable String id) {
        studentService.remove(id);
    }
}
