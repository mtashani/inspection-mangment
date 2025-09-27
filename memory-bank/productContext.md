# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-09-26 00:10:40 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

*   Inspection Management System with FastAPI backend and Next.js frontend

## Key Features

*   Domain-specific routers for PSV, Inspector, Admin, Equipment, Cranes, Corrosion, Daily Reports, Inspections, Maintenance, Authentication, Reports, RBI Calculations, and Notifications
*   Real-time notifications via WebSockets
*   Comprehensive error handling with global exception handlers
*   Database initialization with SQLAlchemy
*   DDD (Domain-Driven Design) structure for organizing code
*   Support for both backend and frontend components
*   Automatic API error logging with domain-specific log files and decorators
*   Role-Based Access Control (RBAC) with department-based permissions and middleware authentication

## Overall Architecture

*   FastAPI backend with modular structure
*   Next.js frontend with component-based architecture
*   Domain-driven design (DDD) pattern
*   Microservices-like organization with separate domains
*   API versioning (V1)
*   Centralized configuration and settings
*   ORM-based database layer (SQLAlchemy)
*   Real-time communication layer (WebSockets)
*   Comprehensive test suite with unit and integration tests