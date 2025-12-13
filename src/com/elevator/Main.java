package com.elevator;

import com.elevator.scenario.BestCaseScenario;
import com.elevator.scenario.ScenarioResult;
import com.elevator.scenario.WorstCaseScenario;
import com.elevator.simulation.SimulationEngine;
import com.elevator.ui.ConsoleUI;

/**
 * Main entry point untuk Smart Elevator System FSA Simulation.
 * 
 * Program ini mensimulasikan Finite State Automata (FSA) untuk
 * Smart Elevator System dengan 2 lift (A & B) dan 3 lantai.
 * 
 * Fitur:
 * - Best Case Scenario: Kondisi optimal, waktu tunggu minimal
 * - Worst Case Scenario: Kondisi chaos, waktu tunggu maksimal
 * - Visualisasi State-Transition Diagram
 * - Next-State Table
 * 
 * @author IN232 Matematika Diskrit
 * @version 1.0
 */
public class Main {

    public static void main(String[] args) {
        // Cek argumen command line
        if (args.length > 0) {
            handleCommandLineArgs(args);
            return;
        }

        // Jalankan interactive UI
        ConsoleUI ui = new ConsoleUI();
        ui.run();
    }

    /**
     * Handler untuk argumen command line.
     * 
     * @param args argumen
     */
    private static void handleCommandLineArgs(String[] args) {
        String scenario = "";
        boolean quiet = false;

        for (String arg : args) {
            if (arg.startsWith("--scenario=")) {
                scenario = arg.substring("--scenario=".length());
            } else if (arg.equals("--quiet") || arg.equals("-q")) {
                quiet = true;
            } else if (arg.equals("--help") || arg.equals("-h")) {
                printHelp();
                return;
            }
        }

        if (!scenario.isEmpty()) {
            runScenarioFromCommandLine(scenario, quiet);
        } else {
            printHelp();
        }
    }

    /**
     * Menjalankan skenario dari command line.
     */
    private static void runScenarioFromCommandLine(String scenarioType, boolean quiet) {
        SimulationEngine engine = new SimulationEngine();

        if (!quiet) {
            System.out.println("\n╔══════════════════════════════════════════════════════════════════╗");
            System.out.println("║     🏢  SMART ELEVATOR SYSTEM - FSA SIMULATION  🛗              ║");
            System.out.println("╚══════════════════════════════════════════════════════════════════╝\n");
        }

        if ("best".equalsIgnoreCase(scenarioType)) {
            BestCaseScenario scenario = new BestCaseScenario();
            if (!quiet) {
                System.out.println(scenario.getStory());
            }
            engine.initialize(scenario);
            ScenarioResult result = engine.runToCompletion(!quiet);
            System.out.println(result.getSummary());
            System.out.println("Rating: " + result.getRating());

        } else if ("worst".equalsIgnoreCase(scenarioType)) {
            WorstCaseScenario scenario = new WorstCaseScenario();
            if (!quiet) {
                System.out.println(scenario.getStory());
            }
            engine.initialize(scenario);
            ScenarioResult result = engine.runToCompletion(!quiet);
            System.out.println(result.getSummary());
            System.out.println("Rating: " + result.getRating());

        } else if ("both".equalsIgnoreCase(scenarioType)) {
            // Best Case
            BestCaseScenario bestCase = new BestCaseScenario();
            engine.initialize(bestCase);
            ScenarioResult bestResult = engine.runToCompletion(false);

            // Worst Case
            WorstCaseScenario worstCase = new WorstCaseScenario();
            engine.initialize(worstCase);
            ScenarioResult worstResult = engine.runToCompletion(false);

            // Print comparison
            printComparison(bestResult, worstResult);

        } else {
            System.err.println("Error: Skenario tidak dikenal: " + scenarioType);
            System.err.println("Gunakan: best, worst, atau both");
        }
    }

    /**
     * Mencetak perbandingan hasil.
     */
    private static void printComparison(ScenarioResult best, ScenarioResult worst) {
        System.out.println("\n╔═══════════════════════════════════════════════════════════════════╗");
        System.out.println("║                    📊 PERBANDINGAN SKENARIO                       ║");
        System.out.println("╠═══════════════════════════════════════════════════════════════════╣");
        System.out.println("║  Metrik                  │  BEST CASE    │  WORST CASE           ║");
        System.out.println("╠══════════════════════════╪═══════════════╪═══════════════════════╣");
        System.out.printf("║  Total Waktu             │  %-12d │  %-20d ║\n",
                best.getTotalSimulationTime(), worst.getTotalSimulationTime());
        System.out.printf("║  Rata-rata Tunggu        │  %-12.1f │  %-20.1f ║\n",
                best.getAverageWaitTime(), worst.getAverageWaitTime());
        System.out.printf("║  Efisiensi               │  %-11.1f%% │  %-19.1f%% ║\n",
                best.getEfficiency(), worst.getEfficiency());
        System.out.println("╠══════════════════════════╧═══════════════╧═══════════════════════╣");
        System.out.printf("║  Best Case Rating  : %-47s ║\n", best.getRating());
        System.out.printf("║  Worst Case Rating : %-47s ║\n", worst.getRating());
        System.out.println("╚═══════════════════════════════════════════════════════════════════╝");
    }

    /**
     * Mencetak bantuan penggunaan.
     */
    private static void printHelp() {
        System.out.println("\n╔══════════════════════════════════════════════════════════════════╗");
        System.out.println("║     SMART ELEVATOR SYSTEM - FSA SIMULATION                       ║");
        System.out.println("╚══════════════════════════════════════════════════════════════════╝");
        System.out.println();
        System.out.println("Penggunaan:");
        System.out.println("  java com.elevator.Main [options]");
        System.out.println();
        System.out.println("Options:");
        System.out.println("  --scenario=<type>   Jalankan skenario tertentu");
        System.out.println("                      type: best, worst, both");
        System.out.println("  --quiet, -q         Mode quiet (output minimal)");
        System.out.println("  --help, -h          Tampilkan bantuan ini");
        System.out.println();
        System.out.println("Contoh:");
        System.out.println("  java com.elevator.Main                    # Interactive mode");
        System.out.println("  java com.elevator.Main --scenario=best    # Jalankan best case");
        System.out.println("  java com.elevator.Main --scenario=worst   # Jalankan worst case");
        System.out.println("  java com.elevator.Main --scenario=both    # Perbandingan");
        System.out.println();
    }
}
