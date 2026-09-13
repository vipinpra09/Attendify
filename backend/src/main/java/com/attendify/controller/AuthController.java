package com.attendify.controller;

import com.attendify.dto.ChangePasswordRequest;
import com.attendify.dto.LoginRequest;
import com.attendify.dto.LoginResponse;
import com.attendify.dto.UserDto;
import com.attendify.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserDto me() {
        return authService.me();
    }

    @PostMapping("/change-password")
    public UserDto changePassword(@RequestBody ChangePasswordRequest request) {
        return authService.changePassword(request);
    }
}
