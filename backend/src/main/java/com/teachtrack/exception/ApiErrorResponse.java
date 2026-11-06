
package com.teachtrack.exception;

import java.time.LocalDateTime;
import java.util.List;

public class ApiErrorResponse {

    private int status;
    private String error;
    private List<String> messages;
    private LocalDateTime timestamp;

    public ApiErrorResponse(
            int status,
            String error,
            List<String> messages,
            LocalDateTime timestamp) {

        this.status = status;
        this.error = error;
        this.messages = messages;
        this.timestamp = timestamp;
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public List<String> getMessages() {
        return messages;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
