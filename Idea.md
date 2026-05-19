# RelAI — Messaging-First Multi-Agent Networking Platform

## One-Line Pitch

RelayAI gives every event attendee an AI networking agent inside Telegram that discovers relevant people, talks to their agents, evaluates fit, and proposes meetings for human approval.

---

# Hackathon Direction

## Main Track

Collaborative Systems

## Secondary Tracks

* Agentic Workflows
* Intelligent Reasoning
* Enterprise Utility

## Main Partner

Gemini

## Secondary Partner

Vultr

## Messaging Platform

Telegram

Reason:
Telegram is realistic for a hackathon:

* fast bot setup
* no business verification
* simple webhook/polling
* easy backend integration
* supports buttons and links
* reliable demo flow

---

# Core Product Idea

Users do not need to open a complex dashboard first.

They start by chatting with a Telegram bot.

The Telegram bot:

1. asks onboarding questions
2. creates the user’s AI agent
3. starts networking
4. sends match results back
5. links to a visual dashboard showing the agent activity

The web app is mainly the visual “Mission Control” dashboard.

---

# Main Demo Flow

## Step 1 — User opens landing page

CTA:
“Start networking with your AI agent”

Button:
“Open Telegram Agent”

---

## Step 2 — Telegram bot starts onboarding

Bot asks:

* What is your name?
* What is your role?
* What company are you from?
* What are your interests?
* Who do you want to meet?
* What is your availability?

Example user goal:
“I want to meet AI infrastructure founders and enterprise investors.”

---

## Step 3 — AI creates user agent

System generates:

* agent persona
* networking goal
* search criteria
* availability constraints

---

## Step 4 — Agent starts networking

The agent:

* searches attendee database
* selects top candidates
* creates temporary target agents
* simulates agent-to-agent conversations
* checks availability
* proposes meetings

---

## Step 5 — Web dashboard visualizes everything

Telegram sends a link:

“Your agent is networking now. Open Mission Control.”

The dashboard shows:

* network graph
* animated agent connections
* live activity feed
* match cards
* meeting proposals

---

## Step 6 — Bot sends final results

Telegram bot sends:

“I found 3 strong matches for you.”

Each result includes:

* name
* role
* company
* match score
* why this person matters
* proposed meeting time
* approve/reject buttons

---

# MVP Scope

Build only:

✅ Telegram bot onboarding
✅ fake event attendee database
✅ Gemini-powered profile extraction
✅ multi-agent matching workflow
✅ React Flow network visualization
✅ meeting proposal cards
✅ approve/reject flow
✅ Vultr deployment

Do not build:

❌ real LinkedIn integration
❌ WhatsApp integration
❌ real calendar integration
❌ complex authentication
❌ permanent autonomous agents
❌ blockchain/payments
❌ mobile app

---

# Recommended Tech Stack

## Frontend

* Next.js
* TypeScript
* TailwindCSS
* shadcn/ui
* React Flow

## Backend

* FastAPI or Next.js API routes

For fastest development, use Next.js API routes unless the team strongly prefers Python.

## AI

* Gemini Flash for fast chat and extraction
* Gemini Pro for deeper match reasoning

## Messaging

* Telegram Bot API

## Database

* Supabase/Postgres

## Deployment

* Vultr VM
* optional Coolify for deployment

---

# Simplified Architecture

Telegram Bot
↓
Backend API
↓
Gemini Agent Orchestrator
↓
Postgres/Supabase Database
↓
React Flow Mission Control Dashboard
↓
Telegram Results

---

# Agent Architecture

Do not create always-running agents.

Instead, create temporary agents during a workflow.

## Agents

### 1. User Representative Agent

Represents the current user.

Responsibilities:

* understand the user goal
* protect user preferences
* decide what kind of people are useful

---

### 2. Matchmaking Agent

Searches attendees.

Responsibilities:

* find relevant people
* rank candidates
* filter weak matches

---

### 3. Target Representative Agent

Represents another attendee.

Responsibilities:

* evaluate whether the target person would be interested
* simulate response
* identify overlap and objections

---

### 4. Scheduling Agent

Finds possible meeting times.

Responsibilities:

* compare availability
* suggest time slot

---

### 5. Summary Agent

Creates final output.

Responsibilities:

* explain why the match matters
* summarize agent conversation
* create meeting recommendation

---

# Database Schema

## attendees

Fields:

* id
* name
* role
* company
* bio
* interests
* goals
* availability
* telegram_chat_id nullable
* created_at

---

## agents

Fields:

* id
* attendee_id
* persona
* networking_goal
* constraints
* created_at

---

## matches

Fields:

* id
* requester_id
* target_id
* score
* reason
* status
* proposed_time
* created_at

Status values:

* pending
* approved
* rejected

---

## conversations

Fields:

* id
* match_id
* messages_json
* summary
* created_at

---

## graph_events

Fields:

* id
* requester_id
* type
* source_node_id
* target_node_id
* status
* message
* created_at

Event types:

* scanning
* contacting
* negotiating
* matched
* rejected
* scheduled

---

# Telegram Bot Flow

## /start

Bot:
“Hi, I’m your RelayAI networking agent. I’ll help you find the most valuable people to meet at this event.”

Ask questions one by one.

---

## Onboarding Questions

1. “What is your full name?”
2. “What is your role and company?”
3. “What topics are you interested in?”
4. “Who do you want to meet?”
5. “When are you available during the event?”

After answers:

Bot:
“Great. I’m creating your AI networking agent now.”

---

## Start Networking

Bot:
“I’ll now scan the event network and talk to other attendee agents.”

Then send dashboard link:

“Open Mission Control: /dashboard/{agentId}”

---

## Final Results Message

Bot:
“I found 3 strong matches for you.”

For each match:

* Name
* Role
* Company
* Match score
* Reason
* Proposed time

Buttons:

* Approve
* Reject

---

# React Flow Visualization

This is the main visual demo feature.

## Nodes

### Center Node

Current user’s AI agent.

### Outer Nodes

Other attendee agents.

## Edge Meaning

Animated edge = agent communication.

## Node Statuses

* idle = gray
* scanning = blue
* contacting = purple
* negotiating = yellow
* matched = green
* rejected = red

---

# Mission Control UI Layout

Page: `/dashboard/[agentId]`

Layout:

Left:

* Telegram-style chat preview

Center:

* React Flow agent network graph

Right:

* live activity feed
* top matches
* meeting proposals

---

# Dashboard Sections

## 1. Agent Status Header

Example:
“Your agent is networking at AI Week Milan”

Status:

* Scanning
* Contacting agents
* Negotiating meetings
* 3 matches found

---

## 2. Network Graph

Show:

* user agent in center
* attendee agents around it
* animated edges
* status colors
* match scores

---

## 3. Live Activity Feed

Examples:

* “Scanning 42 attendees”
* “Contacting Sarah’s agent”
* “Sarah’s agent is evaluating fit”
* “Match score: 87%”
* “Proposed meeting: 14:30”
* “Meeting awaiting approval”

---

## 4. Match Cards

Each card:

* name
* role
* company
* score
* why match matters
* proposed time
* approve/reject buttons

---

# Visual Demo Sequence

When user clicks “Start Networking”:

1. Center node pulses.
2. 10 attendee nodes appear.
3. Animated edges connect to candidates.
4. Nodes change from gray to blue.
5. Strong candidates turn yellow.
6. Accepted matches turn green.
7. Weak matches turn red.
8. Top 3 match cards appear.
9. Telegram bot sends results.

---

# Fake Data Strategy

Preload 30–50 fake attendees.

Example attendees:

* AI infrastructure founder
* enterprise AI investor
* HR innovation manager
* CTO of SaaS company
* AI researcher
* startup mentor
* sales automation founder
* venture partner
* corporate innovation lead
* product manager

This makes the demo reliable.

---

# Gemini Prompts

## Profile Extraction Prompt

Input:
Telegram onboarding answers.

Output JSON:
{
"name": "",
"role": "",
"company": "",
"interests": [],
"networking_goal": "",
"ideal_matches": [],
"availability": []
}

---

## Matchmaking Prompt

Input:
User profile + attendee list.

Task:
Rank the best attendees to meet.

Output JSON:
{
"matches": [
{
"attendee_id": "",
"score": 0,
"reason": "",
"shared_interests": [],
"potential_value": ""
}
]
}

---

## Agent Conversation Prompt

Input:
User agent profile + target attendee profile.

Task:
Simulate a short conversation between both agents.

Output JSON:
{
"conversation": [
{
"speaker": "user_agent",
"message": ""
},
{
"speaker": "target_agent",
"message": ""
}
],
"target_interest": "high | medium | low",
"objections": [],
"should_meet": true
}

---

## Scheduling Prompt

Input:
User availability + target availability.

Output JSON:
{
"available": true,
"proposed_time": "",
"fallback_time": ""
}

---

## Summary Prompt

Input:
Match + conversation + schedule.

Output JSON:
{
"title": "",
"summary": "",
"why_this_match_matters": "",
"suggested_opener": "",
"meeting_agenda": [],
"confidence_score": 0
}

---

# API Routes

## POST /api/telegram/webhook

Receives Telegram updates.

---

## POST /api/onboarding

Stores onboarding answers.

---

## POST /api/agents/create

Creates user agent.

---

## POST /api/agents/:id/start

Starts networking workflow.

---

## GET /api/agents/:id/status

Returns current agent status.

---

## GET /api/agents/:id/graph

Returns graph nodes and edges.

---

## GET /api/agents/:id/matches

Returns match proposals.

---

## POST /api/matches/:id/approve

Approves meeting.

---

## POST /api/matches/:id/reject

Rejects meeting.

---

# Suggested Build Order

## Phase 1 — Core UI

Build:

* landing page
* dashboard page
* React Flow graph
* match cards
* fake activity feed

Goal:
Make it visually impressive first.

---

## Phase 2 — Fake Data + Demo Workflow

Build:

* attendee seed data
* fake graph event sequence
* animated status changes

Goal:
Demo works even before AI integration.

---

## Phase 3 — Telegram Bot

Build:

* BotFather bot
* /start command
* onboarding questions
* save answers
* send dashboard link

Goal:
Real messaging entry point.

---

## Phase 4 — Gemini Integration

Build:

* profile extraction
* match ranking
* conversation simulation
* meeting summary

Goal:
Make the intelligence real.

---

## Phase 5 — Approval Flow

Build:

* approve/reject in dashboard
* optional Telegram inline buttons

Goal:
Complete user loop.

---

# Important Hackathon Principle

The dashboard must work even if Telegram or Gemini fails.

Use fallback demo data.

Never make the live demo dependent on a single external API call.

---

# Pitch Message

RelayAI turns professional networking into an autonomous agent workflow.

Instead of manually searching thousands of event attendees, each person gets an AI representative inside Telegram. The agent understands the user’s goals, talks to other attendee agents, evaluates mutual value, and proposes meetings for approval.

---

# Final Demo Script

1. Open website.
2. Click “Start with Telegram.”
3. Telegram bot asks onboarding questions.
4. Bot creates user agent.
5. Bot sends Mission Control link.
6. Dashboard shows agent contacting other agents.
7. Graph animates agent-to-agent negotiation.
8. Top matches appear.
9. User approves a meeting.
10. Telegram confirms meeting.

---

# What To Emphasize To Judges

This is not a chatbot.

This is:

* a collaborative multi-agent system
* a real agentic workflow
* a messaging-first enterprise utility
* a future-of-work networking layer

---

# Future Expansion

After hackathon:

* WhatsApp integration
* Slack integration
* Microsoft Teams integration
* LinkedIn enrichment
* Google Calendar integration
* enterprise internal networking
* sales lead routing
* recruiting agent
* investor/founder matchmaking

---

# Best Name

Use:

RelayAI

Meaning:

* relays intent
* relays communication
* coordinates agents
* connects people
* works beyond events

Tagline:
“Your AI representative for professional networking.”
