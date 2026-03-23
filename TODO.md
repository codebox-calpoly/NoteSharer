# To-Do

## Based on 3/11/2026 meeting with Parker Jones

### Overall

- [ ]  Optimize page for mobile -  include disclaimer banner or make everything fully compatible

### New User

- [ ]  Landing Page: associate product with Cal Poly (e.g. with logos)
- [ ]  Make the sign-in/sign-up buttons consistent (right now, if we click sign-up on the home-page, it takes us to the /auth route that says “Sign In” on the page. it’s the same page, so maybe we should have Sign-In/Register as the option instead)?
- [ ]  "Use a different email" option after they click send OTP - specify what that's there for (e.g. you incorrectly typed in your email the first time)
- [ ]  Onboarding - modify the flow to include click-to-advance introductory slides (it’s currently just select username + agree to TOS): (1) Welcome to PolyPages! (2) Explain the credit system and the motivation behind why we have a credit system (you gotta upload real notes!) (3) explain banned materials (cannot just post prof’s slides or past exams! it’s their intellectual property). (4) Let’s keep it anonymous -> select username.
- [ ]  "start" instead of "continue to dashboard" (this is more intuitive for new users who don’t know what the dashboard is)

### Dashboard

- [ ]  Normalize the card height. Currently, it’s already normalized by row, so each row is aligned, but cards within rows can still be different heights, which is visually jarring.

![image.png](To-Do/image.png)

- [ ]  The plus sign to the left of “__ notes available” is confusing. let’s remove the plus sign
- [ ]  We can currently filter notes either by downloaded notes or new notes on the dashboard. Ltes’ change this to be a simple “owned” toggle for notes that the user has paid for and thus owns
- [ ]  change “favorites” to “bookmarks”. this includes replacing the star icon (the option to favorite a note) with a bookmark icon
- [ ]  change “-3 credits” to just “Download: 3 credits” on note cards and pop-up modal
- [ ]  Implement truncation for long note titles so that we don’t run into errors
- [ ]  Remove username from cards for notes
- [ ]  Add upload date to cards for notes
- [ ]  Add note type/category to cards for notes
- [ ]  Show total score (upvotes - downvotes) instead of individual upvotes/downvotes.
    - [ ]  Green if positive, red if negative
- [ ]  Remove placeholder text in search notes box for "content", because we don’t have text extraction
- [ ]  Make upload notes instructions less redundant
- [ ]  Add more visual confirmation for successful file upload
- [ ]  After successful file upload, our react-dropzone element still says “no file chosen” on hover. fix this!
- [ ]  Make resource description required on upload

## New Features

- [ ]  Upon onboarding, ask the user to select the courses they are enrolled Prefire enrolled courses in course search/browser
- [ ]  Add backend support (e.g. new columns in the Supabase profiles DB) as needed
- [ ]  Automatically populate enrolled courses in course search/browser so that the user’s courses appear at the top in its own section
- [ ]  Implement functionality so that

### UX/UI

- [ ]  Centralize colorscheme and UI/UX + design. Ground everything in one file that will be the source of truth for all developers and coding agents. Only work on the following after consolidating this and updating AGENTS.md to reference this file you create
- [ ]  Fix upload spinner for light/dark mode (while we’re waiting for the file upload)
- [ ]  Hide free downloads in the navbar if it's 0
- [ ]  Don’t reload persisted components across pages (improves latency)
- [ ]  Leaderboard: if the logged-in user is present on the leaderboard, indicate that it’s you
- [ ]  Profile: make profile logo consistent across pages (right now it shows a silhoutte in the navbar, and the initials of the username elsewhere)
- [ ]  In the profile page, add an option to modify currently-enrolled classes (from new features)
- [ ]  Double check data types in supabase (e.g., why are course numbers currently a TEXT data type?)