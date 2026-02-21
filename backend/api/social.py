from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class TwitterPayload(BaseModel):
    score: int
    roast: str
    video_url: str = None  # Future proofing if we upload the recording to S3

@router.post("/twitter")
def post_to_twitter(payload: TwitterPayload):
    """
    STUB: Posts the specific run's score and AI Roast to a connected Twitter/X Developer account.
    In the fully implemented version using Tweepy:
    
    auth = tweepy.OAuth1UserHandler(
       API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET
    )
    api = tweepy.API(auth)
    tweet = f"Just scored {payload.score} in #BeatOffAI! The Judge thinks: {payload.roast}"
    api.update_status(tweet)
    """
    
    # We pretend the tweet posted successfully so the UI can show a checkmark 
    mock_post_url = f"https://x.com/beatoff_ai/status/mock_tweet_12345"

    return {
        "success": True,
        "message": "Successfully posted score and roast to Twitter/X",
        "url": mock_post_url
    }
