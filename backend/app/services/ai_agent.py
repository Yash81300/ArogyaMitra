# ─── ArogyaMitra AI Agent ──────────────────────────────────────────────────
# Central service that wraps all external AI and third-party API calls:
#   • Groq (LLaMA-3.3-70B) — workout/nutrition plan generation and chat
#   • YouTube Data API v3   — exercise and recipe video search
#   • Spoonacular API       — recipe browsing by diet type

import json
import re
from typing import Dict, List, Optional

from app.utils.config import settings
from app.models.user import User


class ArogyaMitraAgent:
    """
    Orchestrates all AI-powered features for ArogyaMitra.
    A single global instance (`ai_agent`) is created at module load time and
    shared across all requests.
    """

    def __init__(self):
        self.groq_client = None
        self._initialize_ai_clients()

    # ─── Initialisation ────────────────────────────────────────────────────

    def _initialize_ai_clients(self):
        """Set up the Groq client if an API key is configured."""
        try:
            if settings.GROQ_API_KEY:
                from groq import Groq
                self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
                print("✅ Groq AI client initialized")
            else:
                print("⚠️  No GROQ_API_KEY found — AI features will use fallback responses")
        except Exception as e:
            print(f"❌ Failed to initialize Groq client: {e}")


    # ─── Groq API Wrapper ──────────────────────────────────────────────────

    def _call_groq(self, prompt: str, system: str = "", max_tokens: int = 2000) -> str:
        """Make a synchronous Groq chat completion call."""
        if not self.groq_client:
            return self._fallback_response(prompt)
        try:
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.7,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Groq API error: {e}")
            return self._fallback_response(prompt)

    def _fallback_response(self, prompt: str) -> str:
        return (
            "I'm here to help with your fitness journey! "
            "Please configure your GROQ_API_KEY in .env for personalised AI guidance."
        )


    # ─── Workout Plan Generation ───────────────────────────────────────────

    def generate_workout_plan(self, user: User, days: int = 7) -> Dict:
        """
        Generate a personalised workout plan for the user via Groq.
        Falls back to a static default plan if the API call fails.
        """
        system = """You are an expert fitness trainer. Generate a detailed workout plan in JSON format.
The JSON must have this structure:
{
  "title": "Plan title",
  "days": [
    {
      "day": 1,
      "name": "Day name",
      "focus": "muscle group",
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "10-12",
          "rest_seconds": 60,
          "description": "How to perform",
          "muscle_group": "target muscle",
          "calories_burn": 50
        }
      ],
      "total_duration_minutes": 45,
      "total_calories": 300
    }
  ]
}
Return ONLY valid JSON, no other text."""

        prompt = f"""Create a {days}-day workout plan for:
- Fitness Level: {user.fitness_level}
- Goal: {user.fitness_goal}
- Preference: {user.workout_preference}
- Age: {user.age or 'Not specified'}
- Gender: {user.gender or 'Not specified'}"""

        response = self._call_groq(prompt, system, max_tokens=6000)
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception:
            pass
        return self._default_workout_plan(days)

    def _default_workout_plan(self, days: int) -> Dict:
        """Static fallback plan used when the AI call fails."""
        exercises = [
            {"name": "Push-ups",  "sets": 3, "reps": "10-15", "rest_seconds": 60, "description": "Standard push-ups",      "muscle_group": "chest", "calories_burn": 30},
            {"name": "Squats",    "sets": 3, "reps": "15-20", "rest_seconds": 60, "description": "Bodyweight squats",       "muscle_group": "legs",  "calories_burn": 35},
            {"name": "Plank",     "sets": 3, "reps": "30-60 sec", "rest_seconds": 45, "description": "Hold plank position", "muscle_group": "core",  "calories_burn": 20},
        ]
        return {
            "title": "7-Day Fitness Plan",
            "days": [
                {"day": i+1, "name": f"Day {i+1}", "focus": "Full Body",
                 "exercises": exercises, "total_duration_minutes": 45, "total_calories": 300}
                for i in range(days)
            ]
        }


    # ─── Nutrition Plan Generation ─────────────────────────────────────────

    def generate_nutrition_plan(self, user: User, days: int = 7, allergies: list = None) -> Dict:
        """
        Generate a personalised nutrition plan via Groq.
        Calorie target is estimated using the Mifflin-St Jeor BMR formula
        multiplied by a 1.55 moderate-activity factor. Defaults to 2 000 kcal
        if height, weight, or age are missing.
        """
        if allergies is None:
            allergies = []

        # ── BMR Calculation ────────────────────────────────────────────────
        if user.weight and user.height and user.age:
            if user.gender == "male":
                bmr = 88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age)
            elif user.gender == "female":
                bmr = 447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age)
            else:
                # Average of male and female formulas for unspecified gender
                bmr = 267.978 + (11.322 * user.weight) + (3.949 * user.height) - (5.004 * user.age)
            calories = int(bmr * 1.55)  # Moderately active
        else:
            calories = 2000

        system = """You are an expert nutritionist. Generate a detailed nutrition plan in JSON format.
The JSON must have this structure:
{
  "title": "Nutrition Plan title",
  "daily_calories": 2000,
  "macros": {"protein": 150, "carbs": 200, "fat": 65},
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "meal_type": "breakfast",
          "name": "Meal name",
          "description": "Description",
          "calories": 400,
          "protein": 25,
          "carbs": 45,
          "fat": 12,
          "ingredients": ["item1", "item2"],
          "prep_time": "10 minutes"
        }
      ]
    }
  ],
  "grocery_list": ["item1", "item2"]
}
Return ONLY valid JSON."""

        prompt = f"""Create a {days}-day nutrition plan for:
- Diet Type: {user.diet_preference}
- Goal: {user.fitness_goal}
- Daily Calories Target: ~{calories}
- Age: {user.age or 'Not specified'}
- Allergies/Restrictions: {', '.join(allergies) if allergies else 'None'}"""

        response = self._call_groq(prompt, system, max_tokens=6000)
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception:
            pass
        return {
            "title": "Nutrition Plan",
            "daily_calories": calories,
            "macros": {"protein": 150, "carbs": 200, "fat": 65},
            "days": [],
            "grocery_list": []
        }


    # ─── AROMI Chat ────────────────────────────────────────────────────────

    def chat_with_aromi(
        self,
        message: str,
        user: User,
        history: List[Dict] = None,
        context: Dict = None
    ) -> str:
        """
        Chat with AROMI, the ArogyaMitra AI coach.
        Passes the last 10 messages of history to maintain conversational context.
        History is sanitised to ensure strict user/assistant alternation before
        being sent to the model.
        """
        system = f"""You are AROMI, an empathetic and knowledgeable AI fitness coach for ArogyaMitra.
User Profile:
- Name: {user.full_name or user.username}
- Fitness Level: {user.fitness_level}
- Goal: {user.fitness_goal}
- Diet: {user.diet_preference}
- Workout Preference: {user.workout_preference}

Be motivational, supportive, and provide actionable fitness and nutrition advice.
Adapt recommendations based on travel, injuries, mood, or time constraints mentioned.
Keep responses concise (2-4 paragraphs max) and engaging."""

        messages = [{"role": "system", "content": system}]

        # Sanitise history — enforce strict user/assistant alternation
        if history:
            sanitized = []
            for msg in history[-10:]:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if not content:
                    continue
                if sanitized and sanitized[-1]["role"] == role:
                    continue  # Drop consecutive messages with the same role
                sanitized.append({"role": role, "content": content})
            messages.extend(sanitized)

        messages.append({"role": "user", "content": message})

        if not self.groq_client:
            return (
                f"Namaste {user.full_name or user.username}! 🙏 I'm AROMI, your personal fitness companion. "
                "Please configure your GROQ_API_KEY in .env to enable AI-powered coaching!"
            )

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                temperature=0.8,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"I'm having trouble connecting right now. Please try again! Error: {str(e)}"


    # ─── Health Analysis ───────────────────────────────────────────────────

    def analyze_health(self, health_data: Dict, user: User) -> str:
        """Analyse a health assessment form submission and return AI recommendations."""
        system = """You are an expert health and fitness analyst. Analyse the user's health data and provide:
1. BMI assessment and health status
2. Key health considerations for their fitness plan
3. Specific recommendations based on conditions/injuries
4. Safety guidelines
Be informative but remind them to consult healthcare professionals for medical advice.
Do NOT include any title or heading at the start — begin directly with the analysis."""

        prompt = f"""Analyse this health assessment:
{json.dumps(health_data, indent=2)}
User: Age {user.age}, Gender {user.gender}, Goal: {user.fitness_goal}"""

        return self._call_groq(prompt, system, max_tokens=1500)


    # ─── Dynamic Plan Adjustment ───────────────────────────────────────────

    def adjust_plan_dynamically(self, reason: str, current_plan: Dict, user: User) -> Dict:
        """
        Modify an existing plan based on a contextual reason (e.g. travel,
        injury, time constraint). Returns the plan unchanged if parsing fails.
        """
        system = """You are a fitness coach. Modify the given plan based on the reason provided.
Return ONLY valid JSON with the same structure as the input plan, modified appropriately."""

        prompt = f"""Adjust this fitness plan because: {reason}
Current plan summary: {json.dumps(current_plan, indent=2)[:1000]}
User fitness level: {user.fitness_level}, Goal: {user.fitness_goal}"""

        response = self._call_groq(prompt, system, max_tokens=2000)
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
        except Exception:
            pass
        return current_plan  # Return original plan unchanged on failure


    # ─── YouTube Integration ───────────────────────────────────────────────

    def _fetch_youtube_videos(self, query: str) -> List[Dict]:
        """
        Shared helper — search YouTube and return up to 2 video results.
        Returns an empty list if YOUTUBE_API_KEY is not configured.
        """
        if not settings.YOUTUBE_API_KEY:
            return []
        try:
            import requests
            response = requests.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "key": settings.YOUTUBE_API_KEY,
                    "q": query,
                    "part": "snippet",
                    "type": "video",
                    "maxResults": 10,
                    "order": "viewCount",
                    "videoDuration": "medium",
                    "relevanceLanguage": "en"
                },
                timeout=10
            )
            items = response.json().get("items", [])
            return [
                {
                    "video_id": item["id"]["videoId"],
                    "title": item["snippet"]["title"],
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                    "channel": item["snippet"]["channelTitle"],
                    "url": f"https://www.youtube.com/embed/{item['id']['videoId']}"
                }
                for item in items[:2]
            ]
        except Exception as e:
            print(f"YouTube API error: {e}")
            return []

    def get_youtube_exercise_videos(self, exercise_name: str) -> List[Dict]:
        """Fetch tutorial videos for a specific exercise."""
        return self._fetch_youtube_videos(f"{exercise_name} exercise tutorial form")

    def get_youtube_recipe_videos(self, meal_name: str) -> List[Dict]:
        """Fetch cooking/recipe videos for a specific meal."""
        return self._fetch_youtube_videos(f"{meal_name} recipe how to cook")


    # ─── Spoonacular Integration ───────────────────────────────────────────

    def get_spoonacular_recipes(
        self,
        diet_type: str,
        calories: int = 500,
        meal_type: str = "main course"
    ) -> List[Dict]:
        """
        Fetch recipes from Spoonacular matching the user's diet and calorie cap.
        Returns an empty list if SPOONACULAR_API_KEY is not configured.
        """
        if not settings.SPOONACULAR_API_KEY:
            return []
        try:
            import requests
            response = requests.get(
                "https://api.spoonacular.com/recipes/complexSearch",
                params={
                    "apiKey": settings.SPOONACULAR_API_KEY,
                    "diet": diet_type.replace("_", "-"),
                    "maxCalories": calories,
                    "type": meal_type,
                    "number": 5,
                    "addRecipeInformation": True,
                    "addRecipeNutrition": True,
                },
                timeout=10
            )
            return response.json().get("results", [])
        except Exception as e:
            print(f"Spoonacular API error: {e}")
            return []


# ─── Global Instance ───────────────────────────────────────────────────────
# Imported and used by all routers. Initialised once at startup.

ai_agent = ArogyaMitraAgent()
