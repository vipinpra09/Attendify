package com.attendify.exception;

import lombok.Getter;

import java.util.List;

@Getter
public class ApiException extends RuntimeException {

    private final int status;
    private final List<String> errors;

    public ApiException(int status, String message) {
        this(status, message, null);
    }

    public ApiException(int status, String message, List<String> errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(400, message);
    }

    public static ApiException badRequest(String message, List<String> errors) {
        return new ApiException(400, message, errors);
    }

    public static ApiException unauthorized(String message) {
        return new ApiException(401, message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(403, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(404, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(409, message);
    }
}
