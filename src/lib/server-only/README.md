# Server-only modules

Modules in this directory are privileged implementation boundaries. They must never be imported by Client Components or any module reachable from a `"use client"` boundary.

Keep server environment access, private database operations, administrative sessions, queue workers, and secret-bearing provider clients behind this boundary.
