import random
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class RecordedEvent(BaseModel):
    timestamp: float
    limb: str

class FreestylePayload(BaseModel):
    theme: str
    gameMode: str
    player1Sequence: List[RecordedEvent]
    player2Sequence: Optional[List[RecordedEvent]] = None

@router.post("/freestyle")
def evaluate_freestyle(payload: FreestylePayload):
    """
    STUB: Evaluates the freestyle sequence.
    In the fully implemented version, this endpoint will parse the recorded
    events, send them to the LLM (Gemini/OpenAI) to generate the roast and score,
    and then call ElevenLabs to generate the TTS Voiceover.
    """
    
    # Calculate mock scores based on number of events just so it changes
    p1_events = len(payload.player1Sequence)
    p2_events = len(payload.player2Sequence) if payload.player2Sequence else 0
    
    p1_score = min(tuple([100, int(p1_events * 3.5)])) # Just a silly multiplier
    p2_score = min(tuple([100, int(p2_events * 3.5)]))

    # Determine winner context
    if payload.gameMode == 'COOP':
        winner = 1 if p1_score > p2_score else 2
        if p1_score == p2_score:
            winner = 'TIE'
            
        roast = f"Player 1 looked like a disjointed robot attempting the '{payload.theme}' theme, but Player 2 wasn't much better. I guess Player {winner} wins, but honestly, we all lost having to watch that."
    else:
        winner = 1
        roast = f"Wow. That attempt at the '{payload.theme}' theme was truly offensive to both music and basic motor functions. I've seen better rhythm from a broken washing machine."

    # Stub Responses
    return {
        "scoreP1": p1_score,
        "scoreP2": p2_score,
        "winner": winner,
        "roast": roast,
        "audioUrl": "https://storage.googleapis.com/mediapipe-models/placeholder_audio.mp3" # Placeholder
    }
