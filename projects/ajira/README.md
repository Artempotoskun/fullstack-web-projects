# SecureTask (AJIRA)

A lightweight, zero-dependency task management and Jira-like project tracking platform built with Node.js and native SQLite. It combines an interactive Kanban board, monthly calendar scheduling, dynamic status tracking, and a comprehensive analytics dashboard.

> Portfolio demo: tasks, priority matrices, and calendar metrics are stored locally in an embedded database.

## Overview

SecureTask provides a focused, single-binary workflow for managing engineering tickets and deadlines. It features zero npm runtime dependencies, utilizing modern native Node.js APIs for HTTP routing, templating, and embedded relational storage.

## Features

- **Interactive Kanban Board**: Dynamic drag-free status pipelines (`To Do` / `In Progress` / `Done`) with instant state progression.
- **Monthly Calendar Planner**: Date-aware task allocation, visual urgency badging, and multi-day scheduling.
- **Analytics & KPI Dashboard**: Real-time completion rates, active WIP counters, critical urgency alerts, and CSS conic-gradient status charts.
- **Priority Matrix**: Color-coded urgency levels (Urgent / Normal / Low) with live distribution progress bars.
- **Recent Activity Feed**: Real-time log of recently completed deliverables (`Done feed`).
- **Embedded Database Storage**: Native, zero-dependency SQLite persistence via `node:sqlite`.
- **Pure Node.js Architecture**: Zero external npm dependencies; runs instantly with built-in Node modules.

## Architecture & Data Flow

```mermaid
flowchart TD
    Client[Web Browser SPA] -->|REST API / JSON| Server[Node.js HTTP Server]
    Server --> Router{HTTP Method & Route}
    Router -->|GET /api/tasks| SQL_SELECT[(SQLite tasks.db)]
    Router -->|POST /api/tasks| SQL_INSERT[(SQLite tasks.db)]
    Router -->|PATCH /api/tasks/:id| SQL_UPDATE[(SQLite tasks.db)]
    Router -->|DELETE /api/tasks/:id| SQL_DELETE[(SQLite tasks.db)]
    Server -->|HTML/CSS/JS Payload| Client


                          Database Schema

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  day TEXT NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL
);


Field	              Type	                 Description

id	                TEXT	                 Unique epoch timestamp identifier

title	              TEXT	                 Summary of the task or ticket

day	                TEXT	                 Assigned calendar day of the month

color	              TEXT	                 Priority indicator hex color (#22c55e, #eab308, #ef4444)

status	            TEXT	                 Lifecycle status (todo, in_progress, done)


                          Project Structure

AJIRA/
├── server.js          # Core HTTP server, REST API endpoints, and embedded UI
├── tasks.db           # SQLite database file (generated automatically on first run)
├── package.json       # Project metadata and start scripts
└── README.md          # Project documentation

