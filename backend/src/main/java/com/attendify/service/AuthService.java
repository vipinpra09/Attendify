package com.attendify.service;

import com.attendify.dto.ChangePasswordRequest;
import com.attendify.dto.LoginRequest;
import com.attendify.dto.LoginResponse;
import com.attendify.dto.UserDto;
import com.attendify.entity.AppUser;
import com.attendify.exception.ApiException;
import com.attendify.repository.UserRepository;
import com.attendify.security.UserPrincipal;
import com.attendify.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            throw ApiException.unauthorized("Invalid email or password.");
        }
        AppUser user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password."));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password.");
        }
        return new LoginResponse(jwtUtil.generateToken(user), toDto(user));
    }

    public UserDto me() {
        return toDto(currentUser());
    }

    @Transactional
    public UserDto changePassword(ChangePasswordRequest request) {
        AppUser user = currentUser();
        if (request.getCurrent() == null || !passwordEncoder.matches(request.getCurrent(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect.");
        }
        if (request.getNext() == null || request.getNext().length() < 6) {
            throw ApiException.badRequest("New password must be at least 6 characters.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.getNext()));
        return toDto(userRepository.save(user));
    }

    public AppUser currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw ApiException.unauthorized("Your session has expired. Please log in again.");
        }
        return principal.getUser();
    }

    public UserPrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw ApiException.unauthorized("Your session has expired. Please log in again.");
        }
        return principal;
    }

    public static UserDto toDto(AppUser user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .personId(user.getPersonId())
                .createdAt(user.getCreatedAt() == null ? null : user.getCreatedAt().toString())
                .build();
    }
}
