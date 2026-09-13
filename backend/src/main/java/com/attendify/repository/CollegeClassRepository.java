package com.attendify.repository;

import com.attendify.entity.CollegeClass;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollegeClassRepository extends JpaRepository<CollegeClass, String> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, String id);
}
