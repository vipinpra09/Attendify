package com.attendify.repository;

import com.attendify.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, String> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEnrollmentNoIgnoreCase(String enrollmentNo);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, String id);
    boolean existsByEnrollmentNoIgnoreCaseAndIdNot(String enrollmentNo, String id);
    List<Student> findByCollegeClass_IdAndActiveTrueOrderByEnrollmentNoAsc(String classId);
    List<Student> findByCollegeClass_Id(String classId);
    long countByCollegeClass_Id(String classId);
}
