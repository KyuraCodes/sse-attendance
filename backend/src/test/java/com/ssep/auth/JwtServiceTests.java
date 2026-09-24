package com.ssep.auth;

import com.ssep.auth.model.User;
import com.ssep.auth.security.JwtService;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTests {

    private JwtService jwtService;
    private static final String SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long EXPIRATION_MS = 3600000;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    void shouldGenerateAndValidateToken() {
        User user = new User();
        user.setId(10L);
        user.setName("John Doe");
        user.setEmail("john@example.com");
        user.setRole("CEO");

        String token = jwtService.generateToken(user);
        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token));

        String email = jwtService.extractEmail(token);
        assertEquals("john@example.com", email);

        Claims claims = jwtService.extractClaims(token);
        assertEquals(10, ((Number) claims.get("userId")).intValue());
        assertEquals("CEO", claims.get("role"));
        assertEquals("John Doe", claims.get("name"));
    }

    @Test
    void shouldReturnFalseForInvalidToken() {
        assertFalse(jwtService.isTokenValid("invalid.token.string"));
    }
}
