# Future Bug Simulator

> A developer-focused code-change risk analysis tool that estimates the likelihood of future defects before code is shipped.

## Overview

Future Bug Simulator analyzes code changes and provides an explainable risk assessment based on signals such as:

- Number of added and deleted lines
- Previous bug history
- Test status
- Security-related changes
- Payment-related changes
- Database-related changes
- API-related changes
- Files affected by the change

The goal is to help developers identify changes that deserve additional review before deployment.

## Key Features

- 🔍 Git-based code change analysis
- 📊 Risk score from 0–100
- 🟢 LOW / 🟡 MEDIUM / 🔴 HIGH risk classification
- 📁 File-by-file risk analysis
- 🧠 Explainable risk reasons
- 🐛 Previous bug history signal
- 🧪 Test failure signal
- 💳 Payment and security risk detection
- 🗄️ Database and API risk detection
- 📜 Persistent scan history
- 📋 Detailed scan report
- ⚡ React-based developer dashboard

## How It Works

```text
Developer changes code
        ↓
      Git diff
        ↓
   Diff Analyzer
        ↓
    Risk Engine
        ↓
 Risk Score + Reasons
        ↓
 Developer Review