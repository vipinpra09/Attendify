package com.attendify.service;

import com.attendify.dto.ExportResponse;
import com.attendify.enums.Role;
import com.attendify.exception.ApiException;
import com.attendify.init.DataInitializer;
import com.attendify.repository.AttendanceRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SystemService {

    private final AuthService authService;
    private final AttendanceRecordRepository attendanceRepository;
    private final DataInitializer dataInitializer;

    @Transactional
    public void resetDemo() {
        if (authService.currentPrincipal().getRole() != Role.ADMIN) {
            throw ApiException.forbidden("You don't have permission to perform this action.");
        }
        dataInitializer.reseed();
    }

    @Transactional(readOnly = true)
    public ExportResponse exportAll() {
        authService.currentUser();
        return new ExportResponse(LocalDate.now().toString(), attendanceRepository.count());
    }
}
