import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from google import genai
from google.genai import types

router = APIRouter()

class RecordedEvent(BaseModel):
    timestamp: float
    limb: str

class FreestylePayload(BaseModel):
    theme: str
    gameMode: str
    player1Sequence: List[RecordedEvent]
    player2Sequence: Optional[List[RecordedEvent]] = None

class JudgeResponse(BaseModel):
    scoreP1: int = Field(description="Score for player 1, from 0 to 100")
    scoreP2: int = Field(description="Score for player 2, from 0 to 100. Return 0 if single player.")
    winner: str = Field(description="Winner of the match: '1', '2', or 'TIE'")
    roast: str = Field(description="The hilarious, sarcastic roast of the players")
    audioUrl: str = Field(description="Placeholder URL for audio", default="https://storage.googleapis.com/mediapipe-models/placeholder_audio.mp3")

# Initialize Gemini Client (Picks up GEMINI_API_KEY from env automatically)
try:
    client = genai.Client()
except Exception as e:
    client = None
    print(f"Warning: Gemini client failed to initialize. {e}")

@router.post("/freestyle", response_model=JudgeResponse)
def evaluate_freestyle(payload: FreestylePayload):
    """
    Evaluates the freestyle sequence using Gemini 2.5 Flash to generate a 
    sarcastic roast and score based on the performance strings.
    """
    if not client:
        raise HTTPException(status_code=500, detail="Gemini Client is not initialized. Check GEMINI_API_KEY.")
    
    p1_events = len(payload.player1Sequence)
    p2_events = len(payload.player2Sequence) if payload.player2Sequence else 0
    
    if payload.gameMode == 'COOP':
        context = f"""
        Player 1 hit {p1_events} notes. 
        Player 2 hit {p2_events} notes.
        Compare their performances.
        """
    else:
        context = f"""
        Player 1 hit {p1_events} notes.
        """

    prompt = f"""
    You are a harsh, sarcastic, Gordon Ramsay-esque music critic.
    The players are playing a webcam motion tracking rhythm game.
    The current musical theme is: '{payload.theme}'
    
    Here are the stats:
    {context}
    
    Give them a score from 0 to 100 based on their note count. 
    Roast their performance ruthlessly based on the musical theme. 
    If it's co-op, declare a winner ('1', '2', or 'TIE') and explicitly state why the loser was so bad.
    Keep the roast under 3 sentences for punchiness.
    Make it funny and mean.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=JudgeResponse,
                temperature=0.8,
            ),
        )
        
        # Parse the structured JSON response from Gemini
        result = json.loads(response.text)
        # Ensure the placeholder audio URL is always returned for the UI
        result["audioUrl"] = "https://storage.googleapis.com/mediapipe-models/placeholder_audio.mp3"
        return result

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        raise HTTPException(status_code=500, detail=str(e))
