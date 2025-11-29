# MeetSync 🗓️⚡

MeetSync is a simple scheduling app built with React Native (Expo) and Firebase that helps you find the best time for a meeting based on everyone’s availability.

It focuses on two core flows:

- **Share a meeting via code** so others can join from their own accounts.
- **Add participants manually** (guests) with just a name and availability.

The app then recommends conflict‑free time slots and updates everyone’s availability once a time is chosen.

## Features

- Meeting creation:
  - Title, date, duration, time flexibility, type (Online / On‑site), platform/location, tags, recurring flag.
  - Each meeting gets a short **meeting code** that can be shared.
- Home screen:
  - Lists meetings you own and meetings you’ve joined.
  - Owned meetings show a **“View & Share”** action.
  - Joined meetings show **“Finding Best Timing”** until a time is selected.
  - Once a time is selected, the card shows the scheduled date/time.
- Meeting sharing screen:
  - Shows details for the selected meeting.
  - Displays meeting code for sharing.
  - Lists participants (owner, joined users, and manual guests).
  - Shows dynamically updated **Recommended Times**.
- Join by code:
  - Non‑owners can join a meeting using the meeting code.
  - Owner cannot join their own meeting via code.
  - Joined users are added as participants and see the meeting on their home screen.
- Manual participants:
  - Admin can add a participant by name.
  - A simple grid lets you define the guest’s availability.
  - Guest participants are stored in Firestore and included in recommendations.
- Time recommendations:
  - Uses the meeting date, duration, and **timeFlex** to compute a time window.
  - Only suggests slots where **all participants (including manual guests)** are available for the full flex‑adjusted window.
  - As new participants are added, recommendations are recomputed.
- Selecting a time:
  - Meeting owner selects one of the recommended slots.
  - The chosen time is saved on the meeting document.
  - For all non‑guest participants, the selected time window is removed from their availability so it can’t be double‑booked.

## Tech Stack

- **React Native** (Expo)
- **React Navigation** (native stack)
- **Firebase Auth**
- **Cloud Firestore**

## Project Structure

Key files:

- `App.js` – App entry; sets up navigation and global user/availability state.
- `firebaseConfig.js` – Firebase initialization (Auth and Firestore).
- `screens/HomeScreen.js` – Lists owned and joined meetings.
- `screens/LoginScreen.js`, `screens/SignUpScreen.js` – Auth flows.
- `screens/AvailabilityScreen.js` – Initial availability setup.
- `screens/ProfileScreen.js` – Edit profile and availability.
- `screens/MeetingCreationScreen.js` – Create or edit a meeting.
- `screens/MeetingSharingScreen.js` – Share meeting, add participants, see recommendations, select time.
- `screens/MeetingJoinScreen.js` – Join meetings via meeting code.

## Data Model (High‑Level)

### Users (`users` collection)

Example document:

```json
{
  "firstName": "Alex",
  "lastName": "Doe",
  "email": "alex@example.com",
  "availability": {
    "Sun": [9, 10, 11],
    "Mon": [13, 14],
    "Tue": [],
    "Wed": [],
    "Thu": [],
    "Fri": [],
    "Sat": []
  },
  "isGuest": false
}
```

Manual/guest participants are stored as `users` with `isGuest: true` and only name + availability.

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
  "code": "ABC123",

  "participantIds": ["<owner-uid>", "<user-uid-2>"],
  "participants": [
    { "uid": "<owner-uid>", "name": "Owner Name", "isOwner": true, "isGuest": false },
    { "uid": "<user-uid-2>", "name": "Guest 1", "isGuest": true }
  ],

  "selectedSlot": {
    "label": "10:30 - 11:30",
    "startHour": 10,
    "dayKey": "Mon"
  }
}
```

The recommendation logic reads participants’ `availability` and computes a shared time window that respects `duration` and `timeFlex`.

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
   - Share the meeting code or add manual participants and follow the recommended times.
