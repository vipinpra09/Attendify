package com.attendify.controller;

import com.attendify.dto.CollegeClassDto;
import com.attendify.dto.CollegeClassRequest;
import com.attendify.service.CollegeClassService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class CollegeClassController {

    private final CollegeClassService collegeClassService;

    @GetMapping
    public List<CollegeClassDto> list() {
        return collegeClassService.list();
    }

    @PostMapping
    public CollegeClassDto create(@RequestBody CollegeClassRequest request) {
        return collegeClassService.create(request);
    }

    @PutMapping("/{id}")
    public CollegeClassDto update(@PathVariable String id, @RequestBody CollegeClassRequest request) {
        return collegeClassService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable String id) {
        collegeClassService.remove(id);
    }
}
