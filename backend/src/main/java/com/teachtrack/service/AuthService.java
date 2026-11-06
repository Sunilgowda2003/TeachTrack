package com.teachtrack.service;

import com.teachtrack.dto.AuthResponse;

import com.teachtrack.dto.LoginRequest;
import com.teachtrack.dto.RegisterRequest;
import com.teachtrack.entity.Admin;
import com.teachtrack.repository.AdminRepository;
import com.teachtrack.security.JwtService;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.teachtrack.dto.ChangePasswordRequest;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;

    public AuthService(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            UserDetailsService userDetailsService,
            JwtService jwtService) {

        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        if (adminRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "An admin with this email already exists");
        }

        Admin admin = new Admin();
        admin.setFullName(request.getFullName().trim());
        admin.setEmail(email);
        admin.setPassword(
                passwordEncoder.encode(request.getPassword()));

        adminRepository.save(admin);

        UserDetails userDetails =
                userDetailsService.loadUserByUsername(email);

        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(
                token,
                admin.getEmail(),
                admin.getFullName());
    }

    public AuthResponse login(LoginRequest request) {

        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        request.getPassword()));

        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Admin not found"));

        UserDetails userDetails =
                userDetailsService.loadUserByUsername(email);

        String token = jwtService.generateToken(userDetails);

        return new AuthResponse(
                token,
                admin.getEmail(),
                admin.getFullName());
    }
    
    public void changePassword(
            String authenticatedEmail,
            ChangePasswordRequest request) {

        String email = authenticatedEmail.trim().toLowerCase();

        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("Admin not found"));

        // Verify current password
        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                admin.getPassword())) {

            throw new IllegalArgumentException(
                    "Current password is incorrect");
        }

        // Confirm new password
        if (!request.getNewPassword().equals(
                request.getConfirmPassword())) {

            throw new IllegalArgumentException(
                    "New password and confirmation do not match");
        }

        // Prevent using the same password again
        if (passwordEncoder.matches(
                request.getNewPassword(),
                admin.getPassword())) {

            throw new IllegalArgumentException(
                    "New password must be different from current password");
        }

        // Hash and save new password
        admin.setPassword(
                passwordEncoder.encode(request.getNewPassword()));

        adminRepository.save(admin);
    }
}