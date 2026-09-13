package com.attendify.repository;

import com.attendify.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, String>,
        JpaSpecificationExecutor<AttendanceRecord> {

    List<AttendanceRecord> findBySubject_IdAndCollegeClass_IdAndDate(String subjectId, String classId, LocalDate date);

    Optional<AttendanceRecord> findByStudent_IdAndSubject_IdAndDate(String studentId, String subjectId, LocalDate date);

    List<AttendanceRecord> findByStudent_Id(String studentId);

    List<AttendanceRecord> findBySubject_IdIn(List<String> subjectIds);

    void deleteByStudent_Id(String studentId);

    void deleteBySubject_Id(String subjectId);

    long countByStudent_Id(String studentId);

    long countByStudent_IdAndStatus(String studentId, com.attendify.enums.AttendanceStatus status);
}
