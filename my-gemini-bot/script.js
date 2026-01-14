
        // --- ЛОГИКА (JavaScript) ---
        
        const tg = window.Telegram.WebApp;
        tg.expand(); // Раскрываем на весь экран

        const chatContainer = document.getElementById('chat-container');
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');

        // Функция добавления сообщения на экран
        function addMessage(text, sender, isLoading = false) {
            const div = document.createElement('div');
            div.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');
            
            if (isLoading) {
                div.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
                div.id = 'loading-bubble'; // Чтобы потом найти и удалить
            } else {
                // Если это бот, рендерим Markdown (жирный текст, код и т.д.)
                if (sender === 'bot') {
                    div.innerHTML = marked.parse(text);
                } else {
                    div.textContent = text;
                }
            }
            
            chatContainer.appendChild(div);
            // Прокрутка вниз
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Функция отправки
        async function sendMessage() {
            const text = messageInput.value.trim();
            if (!text) return;

            // 1. Показываем сообщение пользователя
            addMessage(text, 'user');
            messageInput.value = '';
            
            // Вибрация (как в нативе)
            if(tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

            // 2. Показываем анимацию загрузки
            addMessage('', 'bot', true);

            try {
                // 3. Отправляем запрос на наш Бэкенд (Python)
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                const data = await response.json();

                // 4. Удаляем анимацию и показываем ответ
                const loadingBubble = document.getElementById('loading-bubble');
                if (loadingBubble) loadingBubble.remove();

                if (data.reply) {
                    addMessage(data.reply, 'bot');
                } else {
                    addMessage('Ошибка: ' + (data.error || 'Нет ответа'), 'bot');
                }

            } catch (error) {
                document.getElementById('loading-bubble')?.remove();
                addMessage('Ошибка сети. Попробуйте позже.', 'bot');
            }
        }

        // Обработчики событий
        sendBtn.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        // Настройка цветов под тему Телеграма (на всякий случай)
        tg.onEvent('themeChanged', function() {
            document.body.style.backgroundColor = tg.themeParams.bg_color;
        });
