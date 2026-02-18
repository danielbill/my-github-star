---
name: executing-plans
description: Use when you have a written implementation plan to execute task-by-task with TDD
---

# Executing Plans

## Overview

Load plan, review critically, execute tasks one by one with TDD, frequent commits.

**Core principle:** Execute tasks one by one with TDD, frequent commits.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Tasks One by One

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Use TDD (test-driven-development skill):
   - RED: Write failing test
   - Verify RED: Confirm test fails
   - GREEN: Write minimal code
   - Verify GREEN: Confirm test passes
   - REFACTOR: Clean up code
4. Run verifications as specified
5. Commit after each task
6. Mark as completed

### Step 3: Report

When task complete:
- Show what was implemented
- Show verification output
- Say: "Task N complete. Ready for next task."

### Step 4: Continue

Continue with next task until all tasks complete.

### Step 5: Complete Development

After all tasks complete and verified:
- Announce: "All tasks complete. Ready for verification."
- **REQUIRED SUB-SKILL:** Use superpowers:verification-before-completion
- Follow that skill to verify tests, check build, validate functionality

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Use TDD for all code changes
- Don't skip verifications
- Reference skills when plan says to
- After each task: report and wait
- Stop when blocked, don't guess
- Frequent commits after each task

## Integration

**Required workflow skills:**
- **superpowers:brainstorming** - Creates design
- **superpowers:writing-plans** - Creates plan this skill executes
- **superpowers:test-driven-development** - Used during execution
- **superpowers:verification-before-completion** - Complete development after all tasks