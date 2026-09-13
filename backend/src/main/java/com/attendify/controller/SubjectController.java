package com.attendify.controller;

import com.attendify.dto.SubjectDto;
import com.attendify.dto.SubjectRequest;
import com.attendify.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public List<SubjectDto> list() {
        return subjectService.list();
    }

    @PostMapping
    public SubjectDto create(@RequestBody SubjectRequest request) {
        return subjectService.create(request);
    }

    @PutMapping("/{id}")
    public SubjectDto update(@PathVariable String id, @RequestBody SubjectRequest request) {
        return subjectService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable String id) {
        subjectService.remove(id);
    }
}
