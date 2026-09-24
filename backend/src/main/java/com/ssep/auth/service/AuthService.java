package com.ssep.auth.service;

import com.ssep.auth.dto.LoginRequest;
import com.ssep.auth.dto.LoginResponse;
import com.ssep.auth.dto.UserDto;
import com.ssep.auth.model.User;
import com.ssep.auth.repository.UserRepository;
import com.ssep.auth.security.JwtService;
import com.ssep.common.exception.AppException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException("Invalid email or password", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new AppException("User account is inactive", "USER_INACTIVE", HttpStatus.UNAUTHORIZED);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException("Invalid email or password", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED);
        }

        String token = jwtService.generateToken(user);
        return new LoginResponse(token, UserDto.fromEntity(user));
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));
        return UserDto.fromEntity(user);
    }

    public UserDto updateProfile(String email, com.ssep.auth.dto.UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));

        user.setName(request.getName().trim());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    public void changePassword(String email, com.ssep.auth.dto.ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException("User not found", "USER_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AppException("Current password does not match", "INVALID_CURRENT_PASSWORD", HttpStatus.BAD_REQUEST);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
