# Note Sharer

Note Sharer is a campus‑specific marketplace where students upload high‑quality notes, Quizlet sets, syllabi, and other course resources. Contributors earn credits from uploads and upvotes, then spend those credits to access others' materials—solving the free‑rider problem and reducing reliance on paywalled platforms like Chegg or Brainly.

## Overview

### Purpose

Students struggle to find consolidated, high‑quality, course‑specific study resources. Existing solutions (group chats, random Drive folders, or paywalled sites) are fragmented, low‑signal, and don't reward contributors—creating a free‑rider dynamic and uneven quality. A campus‑scoped platform with aligned incentives is needed to increase the supply of high‑quality materials without charging cash. Finally, this application will reduce the unfair advantage held by members of some Greek life organizations that share study materials exclusively among their members.

### Team

- [First Last](https://www.linkedin.com/) - Project Manager
- [Joshua Panicker](https://www.linkedin.com/in/joshua-panicker-32610a2b0) - Tech Lead
- [Jonah Chan](https://www.linkedin.com/in/jonah-chan) - Tech Lead
- [Isaiah Cortez](https://www.linkedin.com/in/isaiah-cortez9/) - Designer
- [Noah Gullo](https://www.linkedin.com/in/noah-gullo) - Developer
- [Victor Xie](https://www.linkedin.com/in/victor-xie-767626301/) - Developer
- [Moe Aung](https://www.linkedin.com/) - Developer
- [Wieland Rodriguez](https://www.linkedin.com/in/wieland-rodriguez) - Developer
- [Emma Walker](https://www.linkedin.com/) - Developer

## Getting Started

The fastest way to get up and running is the setup script. It checks your local
dependencies, verifies environment variables, installs packages, and then starts
the dev server only when everything looks good.

```bash
npm run setup
```

### What the setup script checks
- Node.js is installed and prints the version.
- Supabase CLI is installed (or it will tell you how to install it).
- Required environment variables exist in `frontend/.env.local`.
- Frontend dependencies are installed.

### Required environment variables
Create `frontend/.env.local` and include:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Start the dev server
If you want to skip the full checks and just start after installing updates:

```bash
npm run start
```

### Auth flow
Open `/auth`, enter your `@calpoly.edu` email, and use the one-time code to log in.
After that, you will be routed to onboarding or the dashboard.

## Documentation

- Product requirements: `docs/PRD.md`
- Tech stack: `docs/Note_Sharer_Tech_Stack.md`
- Project charter: `docs/project-charter.md`
- Contributing: `docs/contributing.md`
- PR review guide: `docs/PR_REVIEW_GUIDE.md`

## Contributing

Visit [contributing.md](docs/contributing.md) on info for how to contribute to this repo.
