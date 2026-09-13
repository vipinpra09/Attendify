package com.attendify.repository;

import com.attendify.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, String> {
    Optional<Teacher> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
