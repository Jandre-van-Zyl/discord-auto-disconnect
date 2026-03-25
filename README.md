# Discord Auto Disconnect

A lightweight Discord bot that automatically disconnects a target user from a voice channel if they remain:

- in a voice channel
- marked as **Idle/Away**
- **muted or deafened**
- for a continuous configured period

This project is designed as a simple automation tool for users who want to avoid staying connected to Discord voice chat when they go AFK, fall asleep, or forget to leave a channel.

---

# What this project does

This bot watches a specific Discord user and checks whether all of the following are true:

1. The user is in a voice channel
2. The user's Discord status is `Idle`
3. The user is either:
   - self-muted, or
   - self-deafened

If all of those conditions remain true continuously for the configured time threshold, the bot disconnects that user from the voice channel.

---

# What this project is useful for

This is useful if you want to:

- stop staying in a voice channel when you fall asleep
- automatically leave voice when you go AFK for too long
- prevent yourself from sitting in calls for hours while idle
- automate Discord voice cleanup for a single user

---

# Current version limitations

This version currently supports:

- **one target user only**
- **one configured rule**
- running the bot locally on your machine

This version does **not** currently support:

- multiple target users
- full server-wide moderation
- a desktop GUI
- a setup wizard
- hosting for you automatically

---

# How it works

The bot listens for:

- voice state changes
- presence/status changes

It starts a timer when the target user matches the disconnect conditions.

The timer is reset if the user:

- becomes active again
- unmutes and undeafens
- leaves the voice channel
- changes voice channels

If the conditions remain true for the full configured duration, the bot disconnects the user from voice.

---

# Requirements

Before using this project, you need:

- **Node.js** installed
- a **Discord bot application**
- the bot added to your server
- the correct Discord intents enabled
- the correct bot permissions granted

---

# Project files

Your project should look something like this:

```text
discord-auto-disconnect/
├─ .env.example
├─ .gitignore
├─ index.js
├─ package.json
├─ package-lock.json
└─ README.md


