package com.ssep.common;

import com.ssep.common.dto.ApiResponse;
import com.ssep.common.exception.AppException;
import com.ssep.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTests {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void shouldHandleAppExceptionWithCustomStatusAndCode() {
        AppException ex = new AppException("Payment exceeds outstanding balance", "PAYMENT_EXCEEDS_BALANCE", HttpStatus.BAD_REQUEST);
        ResponseEntity<ApiResponse<Void>> response = handler.handleAppException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("PAYMENT_EXCEEDS_BALANCE", response.getBody().getCode());
        assertEquals("Payment exceeds outstanding balance", response.getBody().getMessage());
    }

    @Test
    void shouldHandleGeneralExceptionWith500() {
        Exception ex = new RuntimeException("Unexpected error");
        ResponseEntity<ApiResponse<Void>> response = handler.handleGeneralException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("INTERNAL_ERROR", response.getBody().getCode());
        assertEquals("Internal server error", response.getBody().getMessage());
    }

    @Test
    void shouldCreateOkApiResponse() {
        ApiResponse<String> res = ApiResponse.ok("test-data");
        assertTrue(res.isSuccess());
        assertEquals("test-data", res.getData());
        assertNull(res.getMessage());
        assertNull(res.getCode());

        ApiResponse<String> resWithMsg = ApiResponse.ok("Saved successfully", "test-data");
        assertTrue(resWithMsg.isSuccess());
        assertEquals("Saved successfully", resWithMsg.getMessage());
        assertEquals("test-data", resWithMsg.getData());
        assertNull(resWithMsg.getCode());
    }

    @Test
    void shouldHandleValidationException() {
        org.springframework.validation.BeanPropertyBindingResult bindingResult =
                new org.springframework.validation.BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new org.springframework.validation.FieldError("target", "amount", "must be greater than 0"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiResponse<Void>> response = handler.handleValidationException(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().isSuccess());
        assertEquals("VALIDATION_FAILED", response.getBody().getCode());
        assertEquals("amount: must be greater than 0", response.getBody().getMessage());
    }

    @Test
    void shouldCreateErrorApiResponse() {
        ApiResponse<Void> res = ApiResponse.error("Something went wrong", "ERR_CODE");
        assertFalse(res.isSuccess());
        assertEquals("Something went wrong", res.getMessage());
        assertEquals("ERR_CODE", res.getCode());
        assertNull(res.getData());
    }
}
