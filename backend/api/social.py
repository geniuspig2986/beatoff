import os
from fastapi import APIRouter, UploadFile, Form, File, HTTPException
import tweepy

router = APIRouter()

@router.post("/twitter")
async def post_to_twitter(
    score: int = Form(...),
    roast: str = Form(...),
    video: UploadFile = File(...)
):
    """
    Posts the specific run's score, AI Roast, and gameplay video to Twitter/X.
    """
    api_key = os.environ.get("TWITTER_API_KEY")
    api_secret = os.environ.get("TWITTER_API_SECRET")
    access_token = os.environ.get("TWITTER_ACCESS_TOKEN")
    access_token_secret = os.environ.get("TWITTER_ACCESS_TOKEN_SECRET")

    if not all([api_key, api_secret, access_token, access_token_secret]):
        raise HTTPException(status_code=500, detail="Twitter API keys are not configured.")

    try:
        # Save video temporarily to disk because Tweepy media_upload needs a file path
        temp_video_path = f"temp_{video.filename}"
        with open(temp_video_path, "wb") as f:
            f.write(await video.read())

        # V1 API is required for media uploads
        auth = tweepy.OAuth1UserHandler(
            api_key, api_secret, access_token, access_token_secret
        )
        api_v1 = tweepy.API(auth)
        
        # Upload video
        media = api_v1.media_upload(temp_video_path, media_category="tweet_video")
        
        # Clean up temp file
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

        # V2 API for posting tweets
        client = tweepy.Client(
            consumer_key=api_key,
            consumer_secret=api_secret,
            access_token=access_token,
            access_token_secret=access_token_secret
        )

        tweet_text = f"Just scored {score} in #BeatOffAI! The Judge thinks: {roast}"
        
        # Post tweet with video
        response = client.create_tweet(text=tweet_text, media_ids=[media.media_id])
        
        tweet_id = response.data['id']
        tweet_url = f"https://x.com/user/status/{tweet_id}"

        return {
            "success": True,
            "message": "Successfully posted score, roast, and video to Twitter/X",
            "url": tweet_url
        }

    except Exception as e:
        print(f"Error posting to Twitter: {e}")
        # Clean up temp file if it exists and there was an error
        if 'temp_video_path' in locals() and os.path.exists(temp_video_path):
            os.remove(temp_video_path)
            
        raise HTTPException(status_code=500, detail=f"Failed to post to Twitter: {str(e)}")
