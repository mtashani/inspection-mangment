-- Migration: Make years_experience field optional
-- Date: 2024-01-23
-- Description: Allow NULL values for years_experience column to support wizard-based creation

-- Make years_experience column nullable
ALTER TABLE inspectors ALTER COLUMN years_experience DROP NOT NULL;

-- Add default value of 0 for existing NULL records (if any)
UPDATE inspectors SET years_experience = 0 WHERE years_experience IS NULL;