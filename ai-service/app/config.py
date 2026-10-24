import os
from dotenv import load_dotenv

load_dotenv()

AI_SERVICE_PORT: int = int(os.getenv("AI_SERVICE_PORT", 8000))
