package com.attendify.repository;

import com.attendify.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, String> {
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, String id);
    boolean existsByCodeIgnoreCaseAndTeacher_Id(String code, String teacherId);
    List<Subject> findByTeacher_Id(String teacherId);
    long countByTeacher_Id(String teacherId);
    List<Subject> findByDepartmentAndSemester(String department, int semester);
    long countByDepartmentAndSemester(String department, int semester);
}
