---
trigger: always_on
alwaysApply: true
---


## General Guidelines

- I use **Windows PowerShell** exclusively. All command-line instructions must be compatible with PowerShell syntax.
- I use **Python (FastAPI)** for the backend and **Next.js** for the frontend.
- For running the backend, always **activate the Python virtual environment** first.
- Since every command execution opens a new terminal instance, **all related commands for a task must be written in a single command line** using PowerShell command separators like `;` (avoid using `&&`).
- Use **relative paths** for executing scripts and accessing files to ensure portability.
- Before starting the backend or frontend, **check if the service is already running** to avoid multiple instances.