# Student Study Planner with Smart Scheduling System

A lightweight study planner web app that helps students manage courses, tasks, deadlines, and daily study sessions.

## Features

- User profile setup with weekly available hours
- Add subjects with priority levels
- Add tasks, deadlines, and estimated hours
- Auto-generate a 14-day study schedule
- Track completed and pending tasks
- Dashboard with today’s tasks, progress, and upcoming deadlines
- Adaptive rescheduling when tasks change
- Local data saved in browser storage

## How to Run

1. Open `login.html` in your browser.
2. Sign in with an existing account or click the signup link to create a new one.
3. After login, you will be redirected to `index.html`.
4. Set your name and weekly study hours.
5. Add subjects and tasks.
6. Click `Generate / Refresh Schedule` to build your study plan.

## How to Use

1. Open `login.html` in your browser.
2. Sign in or create a new account on the login screen.
3. Save your profile with your name and weekly study hours.
4. Add subjects and choose priority levels.
5. Add tasks or study topics with deadlines and estimated study hours.
6. Generate the schedule to see your daily study sessions.
7. Mark tasks as complete when finished.
8. Use the `Rebalance Missed Work` button to regenerate the plan after any changes.
9. Toggle dark mode using the button in the top header.

## Notes

- This app is frontend-only and stores data locally in the browser.
- It is mobile-friendly and works offline after the page loads.

## Future Extensions

- Add account registration and backend storage
- Integrate notifications with email or calendar
- Add AI-based weak subject recommendations
- Support multi-day tasks with flexible scheduling

## Deploying to GitHub Pages

This project is a static frontend and can be hosted directly on GitHub Pages.

Quick steps:

1. Create a new repository on GitHub and push this project folder to it.
2. In the repository Settings → Pages, set the source to the `main` branch (or `gh-pages` branch) and root ("/"), then save.
3. Add your GitHub Pages domain to your Firebase project's authorized domains (Firebase Console → Authentication → Sign-in method → Authorized domains). Add `yourusername.github.io` (and `yourusername.github.io/your-repo-name` if using a project site).
4. Visit the published URL (it may take a minute to become available).

Notes:
- The app uses Firebase Auth via the CDN compat scripts; GitHub Pages serves over HTTPS which Firebase Auth requires.
- If you want a one-click deploy with the `gh-pages` package, install it and add a `deploy` script to `package.json` (optional).

If you want, I can add an example `deploy` script that uses `gh-pages` and update `package.json` accordingly.
