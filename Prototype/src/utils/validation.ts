/**
 * Validation Schemas using Zod
 * 
 * Provides runtime validation for user inputs and configuration.
 * 
 * @module utils/validation
 */

import { z } from 'zod';

/**
 * Schema for passenger configuration.
 * Validates name, weight, start/destination floors, and request time.
 */
export const PassengerConfigSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
    weight: z.number()
        .min(20, 'Weight must be at least 20kg')
        .max(200, 'Weight cannot exceed 200kg'),
    startFloor: z.number()
        .int('Floor must be integer')
        .min(1, 'Floor minimum is 1')
        .max(3, 'Floor maximum is 3'),
    destinationFloor: z.number()
        .int('Floor must be integer')
        .min(1, 'Floor minimum is 1')
        .max(3, 'Floor maximum is 3'),
    requestTime: z.number().min(0, 'Request time cannot be negative'),
}).refine(
    (data) => data.startFloor !== data.destinationFloor,
    { message: 'Destination must be different from start floor', path: ['destinationFloor'] }
);

/**
 * Schema for custom passenger injection form.
 */
export const CustomPassengerSchema = z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
    weight: z.coerce.number()
        .min(20, 'Minimum 20kg')
        .max(200, 'Maximum 200kg'),
    start: z.coerce.number()
        .int()
        .min(1, 'Min floor 1')
        .max(3, 'Max floor 3'),
    dest: z.coerce.number()
        .int()
        .min(1, 'Min floor 1')
        .max(3, 'Max floor 3'),
    delay: z.coerce.number()
        .min(0, 'Delay cannot be negative')
        .max(60, 'Max delay 60s'),
}).refine(
    (data) => data.start !== data.dest,
    { message: 'Cannot go to same floor', path: ['dest'] }
);

/**
 * Schema for simulation config.
 */
export const SimulationConfigSchema = z.object({
    liftAStart: z.number().int().min(1).max(3),
    liftBStart: z.number().int().min(1).max(3),
    passengerCount: z.number().int().min(1).max(20),
    useAI: z.boolean(),
});

/**
 * Type inference for validated passenger config.
 */
export type ValidatedPassengerConfig = z.infer<typeof PassengerConfigSchema>;
export type ValidatedCustomPassenger = z.infer<typeof CustomPassengerSchema>;
export type ValidatedSimulationConfig = z.infer<typeof SimulationConfigSchema>;

/**
 * Validates passenger config and returns result.
 * 
 * @param data - Raw passenger config data
 * @returns Validation result with success boolean and data/error
 */
export const validatePassengerConfig = (data: unknown) => {
    return PassengerConfigSchema.safeParse(data);
};

/**
 * Validates custom passenger injection input.
 * 
 * @param data - Raw custom passenger data from form
 * @returns Validation result
 */
export const validateCustomPassenger = (data: unknown) => {
    return CustomPassengerSchema.safeParse(data);
};

/**
 * Validates simulation configuration.
 * 
 * @param data - Raw simulation config
 * @returns Validation result
 */
export const validateSimulationConfig = (data: unknown) => {
    return SimulationConfigSchema.safeParse(data);
};
