package com.attendify.controller;

import com.attendify.dto.NoticeDto;
import com.attendify.dto.NoticeRequest;
import com.attendify.service.NoticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public List<NoticeDto> list() {
        return noticeService.getNotices();
    }

    @PostMapping
    public NoticeDto create(@Valid @RequestBody NoticeRequest request) {
        return noticeService.createNotice(request);
    }

    @DeleteMapping("/{id}")
    public void remove(@PathVariable String id) {
        noticeService.deleteNotice(id);
    }
}
