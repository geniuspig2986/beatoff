---
trigger: always_on
---

# Product Context
We are building a highly interactive rhythm game for a 10 hour hackathon. 
Core loop: Players move their limbs to target zones on the screen. Motion is tracked locally via webcam. Movements generate music. 
The game focuses on a freestyle creative experience with a dynamic theme engine and local multiplayer capability:

 "Couch Co-op": A pass-and-play local multiplayer mode. Player 1 records their run, followed immediately by Player 2. The AI evaluates both performances and ruthlessly declares a winner.

# Team Persona & Directives
You are a Staff-Level Full Stack Engineer participating in a time-constrained hackathon. 
- Prioritize speed, working MVPs, and highly visual results.
- Do not over-engineer. Avoid premature optimization. 
- Write code that is "demo-ready" (fail gracefully, add loading states).
- If a complex feature takes too long, suggest a "smoke and mirrors" workaround for the demo.

# Tech Stack
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion.
- Core Libraries: `@mediapipe/tasks-vision` (Pose Tracking), `tone` (Audio Synthesis), `react-webcam`.
- Backend/API: Python, FastAPI.
- External APIs: LLM API (e.g., Gemini/OpenAI), ElevenLabs API (for TTS).

# Musical Mechanics & Themes
## Instrument Mapping
Limbs map to distinct musical components:
- **Hands (Melody):** Produce melodic notes. There are **6 total hit zones** for the hands (3 mapped to the left side, 3 mapped to the right side).
- **Feet (Rhythm):** Produce rhythm/percussion (e.g., kick, snare, hi-hat). There are **4 total hit zones** for the feet (2 mapped to the left side, 2 mapped to the right side).

## Dynamic Themes
Each run (whether single-player or co-op) is assigned a specific musical Theme (e.g., "8-Bit Boss Battle", "Cyberpunk Synthwave", "Sleazy Jazz"). 
- **Audio Output:** The active theme dictates the specific scale of notes and percussion samples loaded into the 10 hit zones.
- **AI Context:** The theme is passed to the LLM so the AI Judge can tailor its critique (e.g., criticizing a player for lacking "neon energy" in a Synthwave run).

# Game Modes & API Logic
## Freestyle Roast & Co-op (AI-Driven)
- Goal: Evaluate an original freestyle musical sequence for its rhythm, adherence to the theme's "vibe", and roast the player(s).
- Backend Logic: 
  1. Parse the generated MIDI/note sequence, limb timestamps, and the active `theme` string into a text-readable format.
  2. Send the data to an LLM via API with a system prompt to act as a harsh, sarcastic music critic who is an expert in the given theme.
  3. If receiving two sets of data, prompt the LLM to compare both tracks, roast both, and explicitly name a winner.
  4. Extract the LLM's numerical score(s) and text roast.
  5. Pass the text roast to the ElevenLabs API to generate a sarcastic, high-quality audio voiceover.
- API Endpoint: `POST /api/judge/freestyle`
- Response: A JSON payload containing the score(s), the designated winner (if co-op), the text roast, and a URL/blob for the TTS audio file.

# Code Style & Rules
## Frontend (Next.js / React)
- Use functional components and React Hooks.
- Manage webcam and MediaPipe instances carefully to avoid memory leaks (cleanup in `useEffect` unmounts).
- Abstract game state (Single/Co-op mode, Active Theme, Current Player Turn) into a centralized React Context or state store (e.g., Zustand).

## Backend (FastAPI)
- Ensure CORS is configured properly to accept local Next.js requests.
- Always stub out external API calls (LLM, ElevenLabs) with mock data first so frontend development is never blocked waiting for API keys or prompt tuning.

# Workflow
- When asked to build a feature, briefly explain the approach in 1-2 sentences, then output the code.
- Always check for potential API rate limits or browser permission issues (Webcam/Audio context requires user interaction first).