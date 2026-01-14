from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os

# 1. Создаем приложение FastAPI
app = FastAPI()

# 2. Настраиваем Gemini
# Мы берем ключ из "сейфа" (переменных окружения), чтобы не светить его в коде
# Если ключа нет, код не сломается сразу, но не будет работать
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Внимание: API ключ не найден!")

# Настройки модели
generation_config = {
  "temperature": 0.7,  # Креативность (0 - робот, 1 - поэт)
  "top_p": 1,
  "top_k": 1,
  "max_output_tokens": 2048, # Лимит ответа (чтобы не болтал бесконечно)
}

model = genai.GenerativeModel(model_name="gemini-1.5-flash", generation_config=generation_config)


# 3. Описываем, как выглядит запрос от пользователя
# Мы ждем JSON вида: { "message": "Привет, как дела?" }
class UserRequest(BaseModel):
    message: str


# 4. Создаем маршрут (Точка входа)
# Когда кто-то стучится по адресу /api/chat, срабатывает эта функция
@app.post("/api/chat")
async def chat_endpoint(request: UserRequest):
    
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Ошибка сервера: API Key не настроен")

    try:
        # Отправляем сообщение пользователя в Gemini
        # В реальном проекте тут можно добавить историю чата
        response = model.generate_content(request.message)
        
        # Возвращаем только текст ответа
        return {"reply": response.text}

    except Exception as e:
        # Если что-то пошло не так (ошибка Google), говорим об этом
        return {"error": str(e)}