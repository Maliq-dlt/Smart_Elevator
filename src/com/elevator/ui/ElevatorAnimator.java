package com.elevator.ui;

import com.elevator.model.elevator.Direction;
import com.elevator.model.elevator.Elevator;
import com.elevator.model.elevator.ElevatorState;

/**
 * Class untuk menampilkan animasi lift secara visual di console.
 * Animasi yang lebih jelas dan mudah dipahami.
 */
public class ElevatorAnimator {

    private int animationFrame = 0;

    public ElevatorAnimator() {
        this.animationFrame = 0;
    }

    /**
     * Menampilkan visualisasi gedung yang JELAS dan MUDAH DIPAHAMI.
     */
    public void displayBuilding(Elevator liftA, Elevator liftB, boolean showAnimation) {
        int posA = liftA.getCurrentFloor();
        int posB = liftB.getCurrentFloor();

        System.out.println();
        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║                  🏢 SMART ELEVATOR BUILDING                ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║     LANTAI      │     LIFT A      │     LIFT B             ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");

        // Lantai 3
        System.out.println("║                 │                 │                        ║");
        System.out.print("║   LANTAI 3  [▲] │");
        printLiftAtFloor(liftA, 3, posA);
        System.out.print("│");
        printLiftAtFloor(liftB, 3, posB);
        System.out.println("          ║");
        System.out.println("║                 │                 │                        ║");
        System.out.println("╠─────────────────┼─────────────────┼────────────────────────╣");

        // Lantai 2
        System.out.println("║                 │                 │                        ║");
        System.out.print("║   LANTAI 2  [▲▼]│");
        printLiftAtFloor(liftA, 2, posA);
        System.out.print("│");
        printLiftAtFloor(liftB, 2, posB);
        System.out.println("          ║");
        System.out.println("║                 │                 │                        ║");
        System.out.println("╠─────────────────┼─────────────────┼────────────────────────╣");

        // Lantai 1
        System.out.println("║                 │                 │                        ║");
        System.out.print("║   LANTAI 1  [▼] │");
        printLiftAtFloor(liftA, 1, posA);
        System.out.print("│");
        printLiftAtFloor(liftB, 1, posB);
        System.out.println("          ║");
        System.out.println("║                 │                 │                        ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");

        // Status
        System.out.println("║  STATUS LIFT:                                              ║");
        System.out.printf("║  • Lift A: Lantai %d - %s - %d penumpang                  ║%n",
                posA, getStatusText(liftA.getState()), liftA.getPassengerCount());
        System.out.printf("║  • Lift B: Lantai %d - %s - %d penumpang                  ║%n",
                posB, getStatusText(liftB.getState()), liftB.getPassengerCount());
        System.out.println("╚════════════════════════════════════════════════════════════╝");
        System.out.println();

        if (showAnimation) {
            animationFrame = (animationFrame + 1) % 4;
        }
    }

    /**
     * Print lift di posisi tertentu.
     */
    private void printLiftAtFloor(Elevator elevator, int floor, int currentPos) {
        if (currentPos == floor) {
            // Lift ada di lantai ini
            String symbol = getLiftSymbol(elevator);
            System.out.print("    " + symbol + "    ");
        } else {
            // Lift TIDAK ada di lantai ini
            System.out.print("    ║║       ");
        }
    }

    /**
     * Mendapatkan simbol lift berdasarkan status.
     */
    private String getLiftSymbol(Elevator elevator) {
        ElevatorState state = elevator.getState();
        int passengers = elevator.getPassengerCount();

        switch (state) {
            case MOVING_UP:
                return "[▲" + passengers + "▲]";
            case MOVING_DOWN:
                return "[▼" + passengers + "▼]";
            case DOOR_OPEN:
            case DOOR_OPENING:
                return "[ " + passengers + " ]";
            case DOOR_CLOSING:
                return "[|" + passengers + "|]";
            case EMERGENCY:
                return "[!" + passengers + "!]";
            case IDLE:
            default:
                return "[●" + passengers + "●]";
        }
    }

    /**
     * Mendapatkan text status.
     */
    private String getStatusText(ElevatorState state) {
        switch (state) {
            case IDLE:
                return "STANDBY  ";
            case MOVING_UP:
                return "NAIK ▲   ";
            case MOVING_DOWN:
                return "TURUN ▼  ";
            case DOOR_OPEN:
                return "PINTU BUKA";
            case DOOR_OPENING:
                return "MEMBUKA  ";
            case DOOR_CLOSING:
                return "MENUTUP  ";
            case STOPPED:
                return "BERHENTI ";
            case EMERGENCY:
                return "DARURAT! ";
            default:
                return state.toString();
        }
    }

    /**
     * ANIMASI LIFT BERGERAK - VERSI JELAS.
     * Menampilkan pergerakan lift step by step.
     */
    public void animateMovement(String liftName, int fromFloor, int toFloor) {
        String direction = toFloor > fromFloor ? "NAIK ▲" : "TURUN ▼";
        String arrow = toFloor > fromFloor ? "↑" : "↓";

        System.out.println();
        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║           🛗 ANIMASI PERGERAKAN LIFT " + liftName + "                     ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║                                                            ║");
        System.out.printf("║   Lift %s: Lantai %d → Lantai %d (%s)                     ║%n",
                liftName, fromFloor, toFloor, direction);
        System.out.println("║                                                            ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");

        int step = toFloor > fromFloor ? 1 : -1;
        int current = fromFloor;

        while (current != toFloor) {
            // Tampilkan visualisasi per lantai
            System.out.println("║                                                            ║");

            for (int f = 3; f >= 1; f--) {
                String floorLabel = "  LANTAI " + f + ":";
                String liftVisual;

                if (f == current) {
                    liftVisual = "  [■■■■] ← LIFT " + liftName + " DI SINI";
                } else if (f == toFloor) {
                    liftVisual = "  [----] ← TUJUAN";
                } else {
                    liftVisual = "  [    ]";
                }

                System.out.printf("║  %s %s                          ║%n", floorLabel, liftVisual);
            }

            System.out.println("║                                                            ║");
            System.out
                    .println("║              " + arrow + " Lift bergerak " + arrow + "                              ║");
            System.out.println("║                                                            ║");

            // Delay
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            current += step;

            // Clear screen effect (print separator)
            if (current != toFloor) {
                System.out.println("╠════════════════════════════════════════════════════════════╣");
            }
        }

        // Tampilkan posisi akhir
        System.out.println("║                                                            ║");
        for (int f = 3; f >= 1; f--) {
            String floorLabel = "  LANTAI " + f + ":";
            String liftVisual;

            if (f == toFloor) {
                liftVisual = "  [████] ✓ LIFT " + liftName + " TIBA!";
            } else {
                liftVisual = "  [    ]";
            }

            System.out.printf("║  %s %s                          ║%n", floorLabel, liftVisual);
        }
        System.out.println("║                                                            ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out
                .println("║        ✅ LIFT " + liftName + " TIBA DI LANTAI " + toFloor + "                          ║");
        System.out.println("╚════════════════════════════════════════════════════════════╝");
        System.out.println();
    }

    /**
     * ANIMASI IDLE - Lift sedang tidak digunakan.
     */
    public void displayIdleState(Elevator liftA, Elevator liftB) {
        int posA = liftA.getCurrentFloor();
        int posB = liftB.getCurrentFloor();

        System.out.println();
        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║              💤 LIFT DALAM MODE STANDBY                    ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║                                                            ║");
        System.out.println("║   Semua lift sedang MENUNGGU REQUEST                       ║");
        System.out.println("║                                                            ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");

        // Visualisasi posisi lift idle
        for (int f = 3; f >= 1; f--) {
            System.out.print("║   LANTAI " + f + " │");

            // Lift A
            if (posA == f) {
                System.out.print(" [A💤] ");
            } else {
                System.out.print("  ║║   ");
            }

            System.out.print("│");

            // Lift B
            if (posB == f) {
                System.out.print(" [B💤] ");
            } else {
                System.out.print("  ║║   ");
            }

            System.out.println("                              ║");
        }

        System.out.println("║                                                            ║");
        System.out.println("║   Keterangan:                                              ║");
        System.out.println("║   [A💤] = Lift A standby                                   ║");
        System.out.println("║   [B💤] = Lift B standby                                   ║");
        System.out.println("║     ║║  = Shaft kosong                                     ║");
        System.out.println("║                                                            ║");
        System.out.println("╚════════════════════════════════════════════════════════════╝");
        System.out.println();
    }

    /**
     * Menampilkan KETERANGAN SIMBOL untuk edukasi user.
     */
    public void displayLegend() {
        System.out.println();
        System.out.println("╔════════════════════════════════════════════════════════════╗");
        System.out.println("║              📋 KETERANGAN SIMBOL LIFT                     ║");
        System.out.println("╠════════════════════════════════════════════════════════════╣");
        System.out.println("║                                                            ║");
        System.out.println("║   [●0●]  = Lift STANDBY (tidak bergerak), 0 penumpang      ║");
        System.out.println("║   [▲2▲]  = Lift sedang NAIK, 2 penumpang                   ║");
        System.out.println("║   [▼1▼]  = Lift sedang TURUN, 1 penumpang                  ║");
        System.out.println("║   [ 3 ]  = Pintu TERBUKA, 3 penumpang                      ║");
        System.out.println("║   [|2|]  = Pintu sedang MENUTUP, 2 penumpang               ║");
        System.out.println("║   [!0!]  = Lift dalam mode DARURAT                         ║");
        System.out.println("║     ║║   = Shaft kosong (lift di lantai lain)              ║");
        System.out.println("║                                                            ║");
        System.out.println("╚════════════════════════════════════════════════════════════╝");
        System.out.println();
    }

    /**
     * Menampilkan ringkasan status lift yang MUDAH DIBACA.
     */
    public void displayCompactStatus(Elevator liftA, Elevator liftB) {
        System.out.println();
        System.out.println("┌──────────────────────────────────────────────────────┐");
        System.out.println("│              📊 STATUS LIFT SAAT INI                 │");
        System.out.println("├──────────────────────────────────────────────────────┤");
        System.out.printf("│  LIFT A: Lantai %d │ %s │ %d penumpang        │%n",
                liftA.getCurrentFloor(),
                getStatusText(liftA.getState()),
                liftA.getPassengerCount());
        System.out.printf("│  LIFT B: Lantai %d │ %s │ %d penumpang        │%n",
                liftB.getCurrentFloor(),
                getStatusText(liftB.getState()),
                liftB.getPassengerCount());
        System.out.println("└──────────────────────────────────────────────────────┘");
        System.out.println();
    }

    /**
     * Menampilkan animasi dengan cerita.
     */
    public void displayWithStory(Elevator liftA, Elevator liftB, String story, int delayMs) {
        System.out.println();
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        System.out.println("📖 " + story);
        System.out.println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        displayBuilding(liftA, liftB, true);

        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Animasi pintu membuka.
     */
    public void animateDoorOpening(String liftName) {
        System.out.println();
        System.out.print("🚪 Pintu Lift " + liftName + " membuka: ");
        String[] frames = { "[||||]", "[|  |]", "[    ]" };
        for (String frame : frames) {
            System.out.print(frame + " ");
            try {
                Thread.sleep(300);
            } catch (InterruptedException e) {
                break;
            }
        }
        System.out.println("✓ TERBUKA");
    }

    /**
     * Animasi pintu menutup.
     */
    public void animateDoorClosing(String liftName) {
        System.out.println();
        System.out.print("🚪 Pintu Lift " + liftName + " menutup: ");
        String[] frames = { "[    ]", "[|  |]", "[||||]" };
        for (String frame : frames) {
            System.out.print(frame + " ");
            try {
                Thread.sleep(300);
            } catch (InterruptedException e) {
                break;
            }
        }
        System.out.println("✓ TERTUTUP");
    }

    /**
     * Mendapatkan icon arah.
     */
    public String getDirectionIcon(Direction dir) {
        switch (dir) {
            case UP:
                return "⬆️";
            case DOWN:
                return "⬇️";
            default:
                return "⏸️";
        }
    }
}
