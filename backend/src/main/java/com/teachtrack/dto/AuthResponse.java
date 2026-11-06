package com.teachtrack.dto;

public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private String email;
    private String fullName;

    public AuthResponse(String token, String email, String fullName) {
        this.token = token;
        this.email = email;
        this.fullName = fullName;
    }

    public String getToken() {
        return token;
    }

    public String getTokenType() {
        return tokenType;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }
}