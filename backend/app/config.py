from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str
    admin_api_key: str
    adzuna_app_id: str
    adzuna_app_key: str
    serpapi_key: str
    zilliz_uri: str
    zilliz_token: str
    zilliz_collection: str
    supabase_url: str
    supabase_service_role_key: str
    openai_api_key: str = ""
    openrouter_api_key: str = ""
    cron_secret: str = ""
    redis_url: str = ""
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    resend_api_key: str = ""
    supabase_jwt_secret: str = ""
    groq_api_key: str = ""
    deepgram_api_key: str = ""
    cartesia_api_key: str = ""
    cartesia_voice_id: str = ""
    hms_access_key: str = ""
    hms_secret: str = ""
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
