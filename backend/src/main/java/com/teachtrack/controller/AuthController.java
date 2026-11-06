package com.teachtrack.controller;

import com.teachtrack.dto.AuthResponse;
import com.teachtrack.dto.ChangePasswordRequest;
import com.teachtrack.dto.LoginRequest;
import com.teachtrack.dto.RegisterRequest;
import com.teachtrack.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {

        return authService.login(request);
    }

    // Change password for authenticated administrator
    @PutMapping("/change-password")
    public String changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        authService.changePassword(email, request);

        return "Password changed successfully";
    }
}