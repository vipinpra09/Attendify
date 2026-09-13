package com.attendify.util;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

public final class IdUtil {

    private static final AtomicInteger COUNTER = new AtomicInteger();

    private IdUtil() {
    }

    public static String uid(String prefix) {
        return prefix + "_" + Long.toString(System.currentTimeMillis(), 36)
                + Integer.toString(COUNTER.getAndIncrement(), 36)
                + UUID.randomUUID().toString().replace("-", "").substring(0, 6);
    }
}
