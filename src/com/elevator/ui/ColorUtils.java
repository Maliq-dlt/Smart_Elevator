package com.elevator.ui;

/**
 * Utility untuk warna console menggunakan ANSI escape codes.
 */
public class ColorUtils {
    // Reset
    public static final String RESET = "\u001B[0m";

    // Regular Colors
    public static final String BLACK = "\u001B[30m";
    public static final String RED = "\u001B[31m";
    public static final String GREEN = "\u001B[32m";
    public static final String YELLOW = "\u001B[33m";
    public static final String BLUE = "\u001B[34m";
    public static final String PURPLE = "\u001B[35m";
    public static final String CYAN = "\u001B[36m";
    public static final String WHITE = "\u001B[37m";

    // Bold
    public static final String BOLD = "\u001B[1m";

    // Background Colors
    public static final String BG_BLACK = "\u001B[40m";
    public static final String BG_RED = "\u001B[41m";
    public static final String BG_GREEN = "\u001B[42m";
    public static final String BG_YELLOW = "\u001B[43m";
    public static final String BG_BLUE = "\u001B[44m";
    public static final String BG_PURPLE = "\u001B[45m";
    public static final String BG_CYAN = "\u001B[46m";
    public static final String BG_WHITE = "\u001B[47m";

    private static boolean colorEnabled = true;

    public static void setColorEnabled(boolean enabled) {
        colorEnabled = enabled;
    }

    public static boolean isColorEnabled() {
        return colorEnabled;
    }

    public static String colorize(String text, String color) {
        if (!colorEnabled)
            return text;
        return color + text + RESET;
    }

    public static String bold(String text) {
        if (!colorEnabled)
            return text;
        return BOLD + text + RESET;
    }

    public static String red(String text) {
        return colorize(text, RED);
    }

    public static String green(String text) {
        return colorize(text, GREEN);
    }

    public static String yellow(String text) {
        return colorize(text, YELLOW);
    }

    public static String blue(String text) {
        return colorize(text, BLUE);
    }

    public static String cyan(String text) {
        return colorize(text, CYAN);
    }

    public static String purple(String text) {
        return colorize(text, PURPLE);
    }

    // Gray color (bright black)
    public static final String GRAY = "\u001B[90m";

    public static String gray(String text) {
        return colorize(text, GRAY);
    }

    /**
     * Membuat garis horizontal.
     * 
     * @param length    panjang garis
     * @param character karakter untuk garis
     * @return string garis
     */
    public static String horizontalLine(int length, char character) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(character);
        }
        return sb.toString();
    }

    /**
     * Membuat box sederhana.
     * 
     * @param content isi box
     * @param width   lebar box
     * @return string box
     */
    public static String box(String content, int width) {
        StringBuilder sb = new StringBuilder();
        sb.append("┌").append(horizontalLine(width - 2, '─')).append("┐\n");
        sb.append("│ ").append(String.format("%-" + (width - 4) + "s", content)).append(" │\n");
        sb.append("└").append(horizontalLine(width - 2, '─')).append("┘");
        return sb.toString();
    }
}
