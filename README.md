# MeetSync 🗓️⚡

MeetSync is a simple scheduling app built with React Native (Expo) and Firebase that helps you find the best time for a meeting based on everyone’s availability.

It focuses on two core flows:

- **Share a meeting via code** so others can join from their own accounts.
- **Add participants manually** (guests) with just a name and availability.

The app then recommends conflict‑free time slots and updates everyone’s availability once a time is chosen.

## Features

- Meeting creation:
  - Title, date, duration, time flexibility, type (Online / On‑site), platform/location, tags, recurring flag.
  - Each meeting can be shared as a **QR code** or a `meetsync://meeting/<id>` link.
- Home screen:
  - Lists meetings you own and meetings you’ve joined.
  - Owned meetings show a **“View & Share”** action.
  - Joined meetings show **“Finding Best Timing”** until a time is selected.
  - Once a time is selected, the card shows the scheduled date/time.
- Meeting sharing screen:
  - Shows details for the selected meeting.
  - Shows the meeting's QR code and share link.
  - Lists participants (owner, joined users, and manual guests).
  - Shows dynamically updated **Recommended Times**.
- Join by QR code or link:
  - Non‑owners can join by scanning the QR code or opening/pasting the link.
  - Owner cannot join their own meeting.
  - Joined users are added as participants and see the meeting on their home screen.
- Manual participants:
  - Admin can add a participant by name.
  - A simple grid lets you define the guest’s availability.
  - Guests are stored on the meeting itself (not as accounts) and included in recommendations.
- Time recommendations:
  - Uses the meeting date, duration, and **timeFlex** to compute a time window.
  - Only suggests slots where **all participants (including manual guests)** are available for the full flex‑adjusted window and haven't already booked those hours on that date.
  - As new participants are added, recommendations are recomputed.
- Selecting a time:
  - Meeting owner selects one of the recommended slots.
  - The chosen time is saved on the meeting document.
  - Each participant's app then adds those hours to their own `busy` list, so they can't be double‑booked on that date. Their weekly availability is left unchanged.

## Tech Stack

- **React Native** (Expo)
- **React Navigation** (native stack)
- **Firebase Auth**
- **Cloud Firestore** (access controlled by `firestore.rules`)

## Project Structure

Key files:

- `App.js` – App entry; restores the signed‑in session, keeps the profile live, syncs booked hours, and sets up navigation.
- `firebaseConfig.js` – Firebase initialization (Auth and Firestore).
- `screens/HomeScreen.js` – Lists owned and joined meetings.
- `screens/LoginScreen.js`, `screens/SignUpScreen.js` – Auth flows.
- `screens/AvailabilityScreen.js` – Initial availability setup.
- `screens/ProfileScreen.js` – Edit profile and availability.
- `screens/MeetingCreationScreen.js` – Create or edit a meeting.
- `screens/MeetingSharingScreen.js` – Share meeting, add participants, see recommendations, select time.
- `screens/MeetingJoinScreen.js` – Join meetings via QR code or link.
- `utils/date.js` – Local‑calendar date helpers (meeting dates are `YYYY-MM-DD` in local time).
- `utils/scheduling.js` – Recommended times and booked‑hours logic.
- `firestore.rules` – Firestore security rules; tested in `firestore-tests/`.

## Data Model (High‑Level)

### Users (`users` collection)

Example document:

```json
{
  "firstName": "Alex",
  "lastName": "Doe",
  "availability": {
    "Sun": [9, 10, 11],
    "Mon": [13, 14],
    "Tue": [],
    "Wed": [],
    "Thu": [],
    "Fri": [],
    "Sat": []
  },
  "busy": [
    { "date": "2025-01-10", "hours": [10, 11], "recurring": false }
  ]
}
```

- `availability` is a weekly template the user edits.
- `busy` is derived from the scheduled meetings the user is in. Each user's own app writes it; nobody writes another user's profile.
- Emails live only in Firebase Auth, because other signed‑in users can read profiles (to compute recommendations).

### Meetings (`meetings` collection)

Example document (simplified):

```json
{
  "title": "Project Sync",
  "date": "2025-01-10",
  "duration": "1 Hour",
  "timeFlex": "30 mins",
  "type": "On-site",
  "location": "Office HQ",
  "platform": "",
  "recurring": false,
  "tags": ["Work"],

  "ownerUid": "<uid>",

  "participantIds": ["<owner-uid>", "<user-uid-2>"],
  "participants": [
    { "uid": "<owner-uid>", "name": "Owner Name", "isOwner": true, "isGuest": false },
    { "uid": "<user-uid-2>", "name": "Joined User", "isGuest": false },
    { "guestId": "<random-id>", "name": "Guest 1", "isGuest": true, "availability": { "Mon": [10, 11] } }
  ],

  "selectedSlot": {
    "label": "10:30 - 11:30",
    "startHour": 10,
    "dayKey": "Mon"
  }
}
```

The recommendation logic combines each participant’s `availability` (minus their `busy` hours on the meeting date) and computes a shared time window that respects `duration` and `timeFlex`.

## Running the App

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**

   - Open `firebaseConfig.js`.
   - Ensure it points to your Firebase project’s config (Web app).

3. **Start the Expo dev server**

   ```bash
   npm start
   ```

   Or use:

   ```bash
   npm run android
   npm run ios
   npm run web
   ```

4. **Log in / sign up**

   - Create an account or log in.
   - Set your availability when prompted.

5. **Create and share a meeting**

   - From Home, tap **Create Meeting**.
   - Fill in details, then tap the forward arrow to go to the sharing screen.
   - Share the QR code or link, or add manual participants and follow the recommended times.

## Tests

```bash
npm run lint
npm test            # date and scheduling logic
npm run test:tz     # the same tests under several time zones
npm run test:rules  # Firestore security rules (needs Java and the Firebase CLI)
```

## Deploying the security rules

The rules in `firestore.rules` only take effect once they're deployed:

```bash
firebase login
firebase deploy --only firestore:rules
```
