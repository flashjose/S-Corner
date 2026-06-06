package com.scorner.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        String message = e.getMessage();

        if (message != null && message.contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", message));
        }

        if (message != null && message.contains("already exists")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", message));
        }

        if (message != null && (message.contains("Invalid credentials")
            || message.contains("Unauthorized")
            || message.equals("Unauthorized"))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", message));
        }

        if (message != null && (message.contains("required") || message.contains("Invalid email")
            || message.contains("Password must"))) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message));
        }

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", message != null ? message : "Internal server error"));
    }
}
