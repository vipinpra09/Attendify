package com.attendify.repository;

import com.attendify.entity.AppUser;
import com.attendify.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, String> {
    Optional<AppUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<AppUser> findByPersonIdAndRole(String personId, Role role);
    void deleteByPersonIdAndRole(String personId, Role role);
}
