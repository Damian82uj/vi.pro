
// Configuración de la API
const API_KEY = "AIzaSyDSIy5m7mTXlMMR_OOdCu2Af_EwoCd124w";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Variables globales
let currentImage = null;
let isProcessing = false;
let recognition = null;
let isListening = false;

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("Vi.Pro.GPT inicializado correctamente");
    
    // Establecer la hora del mensaje de bienvenida
    document.getElementById('welcome-time').textContent = getCurrentTime();
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar tema guardado
    loadTheme();
    
    // Cargar historial si existe
    loadChatHistory();
});

// Configurar todos los event listeners
function setupEventListeners() {
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const imageBtn = document.getElementById('imageBtn');
    const imageInput = document.getElementById('imageInput');
    const clearChatBtn = document.getElementById('clearChat');
    const themeToggle = document.getElementById('themeToggle');
    const helpBtn = document.getElementById('helpBtn');
    const closeHelp = document.getElementById('closeHelp');
    const charCount = document.getElementById('charCount');
    const quickBtns = document.querySelectorAll('.quick-btn');
    
    // Evento para el botón de enviar
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    // Evento para la tecla Enter en el textarea
    if (userInput) {
        userInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Autoajustar altura del textarea
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            
            // Actualizar contador de caracteres
            if (charCount) {
                const count = this.value.length;
                charCount.textContent = `${count}/2000`;
                
                // Cambiar color si se excede el límite
                if (count > 2000) {
                    charCount.style.color = '#FF6B6B';
                } else {
                    charCount.style.color = '';
                }
            }
        });
        
        // Limitar a 2000 caracteres
        userInput.addEventListener('input', function() {
            if (this.value.length > 2000) {
                this.value = this.value.substring(0, 2000);
                showNotification('Mensaje limitado a 2000 caracteres', 'warning');
            }
        });
    }
    
    // Evento para el botón de voz
    if (voiceBtn) {
        voiceBtn.addEventListener('click', toggleVoiceInput);
    }
    
    // Eventos para subir imagen
    if (imageBtn && imageInput) {
        imageBtn.addEventListener('click', function() {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', handleImageUpload);
    }
    
    // Evento para limpiar el chat
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }
    
    // Evento para cambiar tema
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Eventos para panel de ayuda
    if (helpBtn) {
        helpBtn.addEventListener('click', toggleHelpPanel);
    }
    
    if (closeHelp) {
        closeHelp.addEventListener('click', toggleHelpPanel);
    }
    
    // Eventos para botones de acción rápida
    quickBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
    
    // Prevenir arrastrar y soltar archivos en el área de texto
    if (userInput) {
        userInput.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#4361EE';
        });
        
        userInput.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
        });
        
        userInput.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.match('image.*')) {
                handleDroppedImage(files[0]);
            }
        });
    }
    
    // Cerrar panel de ayuda al hacer clic fuera
    document.addEventListener('click', function(e) {
        const helpPanel = document.getElementById('helpPanel');
        const helpBtn = document.getElementById('helpBtn');
        
        if (helpPanel.classList.contains('active') && 
            !helpPanel.contains(e.target) && 
            e.target !== helpBtn && 
            !helpBtn.contains(e.target)) {
            toggleHelpPanel();
        }
    });
}

// Función para manejar acciones rápidas
function handleQuickAction(action) {
    let message = '';
    
    switch(action) {
        case 'landing':
            message = "Quiero crear una landing page efectiva para mi producto/servicio. ¿Puedes ayudarme con el diseño, estructura y contenido?";
            break;
        case 'portfolio':
            message = "Necesito crear un portafolio web profesional para mostrar mis trabajos y habilidades. ¿Qué estructura y diseño me recomiendas?";
            break;
        case 'ecommerce':
            message = "Quiero desarrollar una tienda online. ¿Puedes ayudarme con el diseño, funcionalidades y mejores prácticas para e-commerce?";
            break;
        case 'blog':
            message = "Deseo diseñar un blog atractivo y funcional. ¿Qué características y estructura son esenciales para un blog moderno?";
            break;
        default:
            message = "Quiero crear una página web profesional. ¿Puedes ayudarme con el diseño y desarrollo?";
    }
    
    document.getElementById('userInput').value = message;
    sendMessage();
}

// Función para mostrar/ocultar panel de ayuda
function toggleHelpPanel() {
    const helpPanel = document.getElementById('helpPanel');
    helpPanel.classList.toggle('active');
    
    // Crear overlay si no existe
    let overlay = document.querySelector('.overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
    }
    
    overlay.classList.toggle('active');
    
    // Cerrar panel al hacer clic en overlay
    overlay.addEventListener('click', toggleHelpPanel);
}

// Función para manejar la subida de imágenes
function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    handleImageFile(file);
    
    // Limpiar el input de archivo
    event.target.value = '';
}

// Función para manejar imágenes arrastradas
function handleDroppedImage(file) {
    handleImageFile(file);
}

// Función común para manejar archivos de imagen
function handleImageFile(file) {
    // Verificar que sea una imagen
    if (!file.type.match('image.*')) {
        showNotification('Por favor, selecciona solo archivos de imagen.', 'error');
        return;
    }
    
    // Limitar el tamaño de la imagen (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen es demasiado grande. Por favor, selecciona una imagen menor a 5MB.', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        // Guardar la imagen en base64 para enviarla a la API
        currentImage = e.target.result;
        
        // Mostrar la imagen en el chat
        addImageToChat(currentImage);
        
        // Enviar la imagen al bot para análisis
        getBotResponse("Analiza esta imagen para propósitos de diseño web", currentImage);
    };
    
    reader.onerror = function() {
        showNotification('Error al cargar la imagen. Inténtalo de nuevo.', 'error');
    };
    
    reader.readAsDataURL(file);
}

// Función para mostrar la imagen en el chat
function addImageToChat(imageData) {
    const chatBox = document.getElementById('chatBox');
    
    if (!chatBox) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.setAttribute('data-type', 'image');
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const image = document.createElement('img');
    image.src = imageData;
    image.className = 'message-image';
    image.alt = 'Imagen enviada por el usuario';
    image.loading = 'lazy';
    
    const caption = document.createElement('div');
    caption.className = 'image-caption';
    caption.textContent = 'Imagen de referencia enviada';
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    contentDiv.appendChild(image);
    contentDiv.appendChild(caption);
    contentDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatBox.appendChild(messageDiv);
    
    // Scroll al final del chat
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Guardar en el historial
    saveChatHistory();
}

// Función para enviar mensaje
function sendMessage() {
    // Evitar múltiples envíos simultáneos
    if (isProcessing) {
        showNotification('El sistema está procesando una solicitud, por favor espera...', 'info');
        return;
    }
    
    const userInput = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    
    if (!userInput || !chatBox) {
        console.error("Elementos del DOM no encontrados");
        return;
    }
    
    const userText = userInput.value.trim();
    
    // Si no hay texto y no hay imagen, mostrar alerta
    if (!userText && !currentImage) {
        showNotification('Por favor, describe tu proyecto web o sube una imagen de referencia.', 'info');
        return;
    }
    
    // Agregar mensaje del usuario al chat (si hay texto)
    if (userText) {
        addMessageToChat('user', userText);
    }
    
    // Limpiar el campo de entrada
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Actualizar contador de caracteres
    const charCount = document.getElementById('charCount');
    if (charCount) {
        charCount.textContent = '0/2000';
    }
    
    // Marcar como procesando
    isProcessing = true;
    document.getElementById('sendBtn').disabled = true;
    
    // Obtener respuesta del bot
    getBotResponse(userText, currentImage);
    
    // Limpiar la imagen actual después de enviar
    currentImage = null;
}

// Función para agregar mensaje al chat
function addMessageToChat(sender, text) {
    const chatBox = document.getElementById('chatBox');
    
    if (!chatBox) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.setAttribute('data-type', 'text');
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-rocket"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Formatear el texto para mejor legibilidad
    const formattedText = formatMessageText(text);
    
    // Procesar texto para formato de código
    if (sender === 'bot' && text.includes('```')) {
        contentDiv.innerHTML = formatCodeBlocks(text);
    } else {
        contentDiv.innerHTML = formattedText;
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    contentDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    chatBox.appendChild(messageDiv);
    
    // Scroll al final del chat
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Guardar en el historial
    saveChatHistory();
}

// Función para formatear el texto de los mensajes
function formatMessageText(text) {
    if (!text) return '';
    
    // Escapar HTML para seguridad
    let formattedText = escapeHtml(text);
    
    // Reemplazar patrones de listas con asteriscos por listas HTML
    formattedText = formattedText.replace(/\n\s*\*\s+/g, '\n• ');
    
    // Convertir listas con viñetas a HTML
    formattedText = formattedText.replace(/(\n•\s+[^\n]+(\n•\s+[^\n]+)*)/g, function(match) {
        const items = match.trim().split('\n');
        let listHtml = '<ul>';
        items.forEach(item => {
            // Eliminar el marcador de lista y limpiar espacios
            const cleanItem = item.replace(/^•\s+/, '').trim();
            if (cleanItem) {
                listHtml += `<li>${cleanItem}</li>`;
            }
        });
        listHtml += '</ul>';
        return listHtml;
    });
    
    // Convertir listas numeradas a HTML
    formattedText = formattedText.replace(/(\n\d+\.\s+[^\n]+(\n\d+\.\s+[^\n]+)*)/g, function(match) {
        const items = match.trim().split('\n');
        let listHtml = '<ol>';
        items.forEach(item => {
            // Eliminar el número y limpiar espacios
            const cleanItem = item.replace(/^\d+\.\s+/, '').trim();
            if (cleanItem) {
                listHtml += `<li>${cleanItem}</li>`;
            }
        });
        listHtml += '</ol>';
        return listHtml;
    });
    
    // Reemplazar saltos de línea por etiquetas <br>
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    // Formatear negritas y cursivas
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Detectar y formatear encabezados
    formattedText = formattedText.replace(/### (.*?)(<br>|$)/g, '<h3>$1</h3>');
    formattedText = formattedText.replace(/## (.*?)(<br>|$)/g, '<h4>$1</h4>');
    formattedText = formattedText.replace(/# (.*?)(<br>|$)/g, '<h3>$1</h3>');
    
    // Envolver el texto en un párrafo si no contiene listas o encabezados
    if (!formattedText.includes('<ul>') && !formattedText.includes('<ol>') && 
        !formattedText.includes('<h3>') && !formattedText.includes('<h4>')) {
        formattedText = `<p>${formattedText}</p>`;
    }
    
    return formattedText;
}

// Función para formatear bloques de código
function formatCodeBlocks(text) {
    // Reemplazar bloques de código con formato HTML
    return text.replace(/```(\w+)?\s*([\s\S]*?)```/g, function(_, language, code) {
        return `<pre><code class="language-${language || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
    });
}

// Función para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Función para obtener la hora actual formateada
function getCurrentTime() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + 
           now.getMinutes().toString().padStart(2, '0');
}

// Función para obtener respuesta del bot
async function getBotResponse(userMessage, imageData = null) {
    const chatBox = document.getElementById('chatBox');
    
    // Mostrar indicador de "escribiendo"
    const typingIndicator = showTypingIndicator();
    
    try {
        // Preparar el contenido para la API
        const contents = [{
            parts: []
        }];
        
        // Agregar contexto especializado en diseño web
        const systemPrompt = "Eres Vi.Pro.GPT, un asistente especializado en creación de páginas web profesionales. Tu expertise incluye: diseño responsive, desarrollo frontend, UX/UI, optimización SEO y mejores prácticas web. Responde de manera concreta y práctica, enfocándote en soluciones reales para proyectos web. Cuando sea relevante, proporciona ejemplos de código HTML, CSS o JavaScript.";
        
        // Agregar texto si existe
        let fullMessage = userMessage;
        if (systemPrompt && userMessage) {
            fullMessage = systemPrompt + "\n\nPregunta del usuario: " + userMessage;
        } else if (systemPrompt) {
            fullMessage = systemPrompt;
        }
        
        if (fullMessage) {
            contents[0].parts.push({ text: fullMessage });
        }
        
        // Agregar imagen si existe
        if (imageData) {
            // Convertir data URL a base64 (eliminar el prefijo data:image/...;base64,)
            const base64Data = imageData.split(',')[1];
            const mimeType = imageData.split(';')[0].split(':')[1];
            
            contents[0].parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            });
        }
        
        // Configurar timeout para evitar respuestas lentas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remover el indicador de "escribiendo"
        hideTypingIndicator(typingIndicator);
        
        // Extraer el texto de respuesta
        const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                           "Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo.";
        
        // Dividir respuestas largas en partes más pequeñas para mejor legibilidad
        if (botResponse.length > 500) {
            const responseParts = splitLongResponse(botResponse);
            responseParts.forEach((part, index) => {
                // Pequeña pausa entre mensajes largos para mejorar la experiencia
                setTimeout(() => {
                    addMessageToChat('bot', part);
                }, index * 300);
            });
        } else {
            // Agregar respuesta al chat
            addMessageToChat('bot', botResponse);
        }
        
    } catch (error) {
        console.error('Error al obtener respuesta del bot:', error);
        
        // Remover el indicador de "escribiendo"
        hideTypingIndicator(typingIndicator);
        
        // Mostrar mensaje de error apropiado
        let errorMessage = '⚠️ Error de conexión. Por favor, verifica tu conexión a Internet e intenta nuevamente.';
        
        if (error.name === 'AbortError') {
            errorMessage = '⚠️ La solicitud está tardando demasiado. Por favor, intenta con una consulta más específica o más tarde.';
        } else if (error.message.includes('429')) {
            errorMessage = '⚠️ Límite de solicitudes excedido. Por favor, espera un momento antes de intentar nuevamente.';
        }
        
        addMessageToChat('bot', errorMessage);
    } finally {
        // Marcar como no procesando
        isProcessing = false;
        document.getElementById('sendBtn').disabled = false;
    }
}

// Función para mostrar indicador de escritura
function showTypingIndicator() {
    const chatBox = document.getElementById('chatBox');
    
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot typing';
    typingIndicator.id = 'typing-indicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = '<i class="fas fa-rocket"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const typingDots = document.createElement('div');
    typingDots.className = 'typing-dots';
    typingDots.innerHTML = '<span></span><span></span><span></span>';
    
    contentDiv.appendChild(typingDots);
    typingIndicator.appendChild(avatarDiv);
    typingIndicator.appendChild(contentDiv);
    
    chatBox.appendChild(typingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return typingIndicator;
}

// Función para ocultar indicador de escritura
function hideTypingIndicator(typingIndicator) {
    if (typingIndicator && typingIndicator.parentNode) {
        typingIndicator.parentNode.removeChild(typingIndicator);
    }
}

// Función para dividir respuestas largas en partes más manejables
function splitLongResponse(text) {
    const maxLength = 500;
    const parts = [];
    let currentPart = '';
    
    // Dividir por oraciones para mantener la coherencia
    const sentences = text.split(/(?<=[.!?])\s+/);
    
    for (const sentence of sentences) {
        if ((currentPart + sentence).length <= maxLength) {
            currentPart += sentence + ' ';
        } else {
            if (currentPart.trim()) {
                parts.push(currentPart.trim());
            }
            currentPart = sentence + ' ';
        }
    }
    
    if (currentPart.trim()) {
        parts.push(currentPart.trim());
    }
    
    return parts.length > 0 ? parts : [text];
}

// Función para entrada de voz
function toggleVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showNotification('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.', 'error');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';
        
        recognition.onstart = function() {
            isListening = true;
            document.getElementById('voiceBtn').innerHTML = '<i class="fas fa-microphone-slash"></i>';
            document.getElementById('voiceBtn').style.color = '#FF6B6B';
            showNotification('Escuchando... Habla ahora.', 'info');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('userInput').value = transcript;
            
            // Auto-enviar después de un breve retraso
            setTimeout(() => {
                if (transcript.trim().length > 0) {
                    sendMessage();
                }
            }, 500);
        };
        
        recognition.onerror = function(event) {
            console.error('Error en reconocimiento de voz:', event.error);
            
            if (event.error === 'not-allowed') {
                showNotification('El acceso al micrófono no está permitido. Por favor, habilita los permisos.', 'error');
            } else {
                showNotification('Error en el reconocimiento de voz: ' + event.error, 'error');
            }
        };
        
        recognition.onend = function() {
            isListening = false;
            document.getElementById('voiceBtn').innerHTML = '<i class="fas fa-microphone"></i>';
            document.getElementById('voiceBtn').style.color = '';
        };
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Función para cambiar tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Actualizar icono
    const themeIcon = document.querySelector('#themeToggle i');
    themeIcon.className = newTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    
    showNotification(`Tema cambiado a ${newTheme === 'light' ? 'claro' : 'oscuro'}`, 'success');
}

// Función para cargar tema guardado
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Actualizar icono
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = savedTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Función para limpiar el chat
function clearChat() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    // Confirmar antes de limpiar
    if (chatBox.children.length > 1 && !confirm('¿Estás seguro de que quieres limpiar la conversación?')) {
        return;
    }
    
    // Mantener solo el mensaje de bienvenida
    while (chatBox.children.length > 1) {
        chatBox.removeChild(chatBox.lastChild);
    }
    
    // Limpiar almacenamiento local
    localStorage.removeItem('chatHistory');
    
    showNotification('Conversación limpiada', 'success');
}

// Función para guardar historial del chat
function saveChatHistory() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    // No guardar el indicador de escritura
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    const history = chatBox.innerHTML;
    localStorage.setItem('chatHistory', history);
}

// Función para cargar historial del chat
function loadChatHistory() {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) return;
    
    const history = localStorage.getItem('chatHistory');
    if (history) {
        chatBox.innerHTML = history;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    // Configurar clase según el tipo
    notification.className = 'notification';
    if (type === 'error') notification.classList.add('error');
    if (type === 'success') notification.classList.add('success');
    if (type === 'warning') notification.classList.add('warning');
    
    notification.textContent = message;
    notification.classList.add('show');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Manejar la visibilidad de la página para pausar reconocimiento de voz
document.addEventListener('visibilitychange', function() {
    if (document.hidden && recognition && isListening) {
        recognition.stop();
    }
});

// Prevenir la recarga accidental de la página
window.addEventListener('beforeunload', function(e) {
    if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Tienes una solicitud en proceso. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
    }
});    