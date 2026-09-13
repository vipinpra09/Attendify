package com.attendify.util;

public final class AttendanceMath {

    public static final int MIN_ATTENDANCE = 75;

    private AttendanceMath() {
    }

    public static Double pct(int attended, int total) {
        if (total == 0) {
            return null;
        }
        return Math.round((attended / (double) total) * 1000.0) / 10.0;
    }

    public static boolean isLow(Double percent) {
        return percent != null && percent < MIN_ATTENDANCE;
    }

    public static int classesNeeded(int attended, int total) {
        if (total == 0) {
            return 0;
        }
        int need = (int) Math.ceil((MIN_ATTENDANCE * total - 100.0 * attended) / (100.0 - MIN_ATTENDANCE));
        return Math.max(0, need);
    }

    public static String dash(Double value) {
        return value == null ? "—" : String.valueOf(value);
    }
}
