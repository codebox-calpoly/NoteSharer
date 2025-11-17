# Project Charter

## Team Information
- Project name: Note Sharer
- Team leads: Jonah Chan, Joshua Panicker

## Project Overview
### Project Description
Note Sharer is a campus‑specific marketplace where students upload high‑quality notes, Quizlet sets, syllabi, and other course resources. Contributors earn credits from uploads and upvotes, then spend those credits to access others’ materials—solving the free‑rider problem and reducing reliance on paywalled platforms like Chegg or Brainly.

### Project Goals
1. Conglomerate course-specific study materials for a single university
2. Implement credit economy: earn credits via uploads and upvotes; spend credits to unlock downloads
3. Ensure quality via upvotes, reporting system
4. Protect academic integrity via moderation tools and clear content policies 

### Why It Matters
Students struggle to find consolidated, high‑quality, course‑specific study resources. Existing solutions (group chats, random Drive folders, or paywalled sites) are fragmented, low‑signal, and don’t reward contributors—creating a free‑rider dynamic and uneven quality. A campus‑scoped platform with aligned incentives is needed to increase the supply of high‑quality materials without charging cash. Finally, this application will reduce the unfair advantage held by members of some Greek life organizations that share study materials exclusively among their members.

## Tech Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | next.js | user interface|
|Backend | Supabase | API + auth|
|Database | Supabase | accounts + file storage|
|Tools/Infra | Supabase | hosted on free supabase tier|
|Design | Figma | visual/UX design|

## Release Timeline
|Release Stage | Target Date | Description|
|--------------|-------------|------------|
|Internal release | start of winter quarter | core functionality demoed within project team|
|User group release | middle of winter quarter (week 6/7) | feedback round with test users|
|Public/club release | end of winter quarter/beginning of spring quarter | fully functional release, ready for on-campus use|

## Team Expectations
2 week sprints, weekly meetings in-person on Wednesdays
Active communication on Discord on the in-between days

## Project management
### Version Control/Workflow
- Pick an issue and assign self
- Create a branch and develop locally
- Submit a PR >= 2 days before the biweekly meeting
- Assign tech leads as reviewers
- Tech leads will manage pull requests and merges

### Link to Repo
https://github.com/codebox-calpoly/NoteSharer

### Task tracking
GitHub Projects - Kanban view to keep track of issues and in-progress work

## Challenges and Risks
Developing frontend before backend functionality fully finished
Integrating backend functionality that was developed by different people at the same time
Mitigation strategies: create issues with a clear vision of how to integrate, actively communicate with other developers to ensure compatibility of features

## Budget
|Item | Purpose | Estimated Cost|
|------|----------|--------------|
|Supabase | expanding storage when we actually deploy the app | $25 a month|
|AWS credits(?) | potentially for calling LLMs | varies|

## Deliverables Overview
### Key Milestones
MVP ready by early-to-mid winter quarter

### Expected Outcomes
Web app fully functioning with authenticiation. No AI features for initial release

## Duration Summary
### Start Date: Sun, Nov 16 2025
### End Date: TBD
### Total Duration: TBD

## Additional Notes / Comments
- Dependencies: Python, Supabase CLI, supabase-py
- Mentors: Matthew Blam, Rishi Thakkar, Dakshesh Pasala
- Collaborations: Potentially a collaboration with CSAI for AI-enhanced note-ingestion
