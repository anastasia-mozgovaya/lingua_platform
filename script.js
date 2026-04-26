// Глобальные переменные
let currentDeck = [];
let currentCardIndex = 0;
let currentCardData = null;
let answerRevealed = false;
let currentRating = null;
let studyActive = false;
let recentWords = [];
let topicsData = null;
let userTopics = [];
let userLessons = [];
let userCards = [];

// Каждая колода содержит карточки и время следующего повторения
let repetitionDecks = {
    forgot: { name: "Не запомнил", cards: [], interval: 1 },
    normal: { name: "Нормально", cards: [], interval: 12 },
    good: { name: "Хорошо", cards: [], interval: 24 },
    great: { name: "Отлично", cards: [], interval: 96 }
};

let currentUser = null;
let appSettings = { forgot: 1, normal: 12, good: 24, great: 96 };
let lessonProgress = {};
let users = JSON.parse(localStorage.getItem('users')) || [];

// DOM элементы
const mainContentDiv = document.getElementById('mainContent');
const studySidebarBtn = document.getElementById('studyBtnSidebar');
const repeatBtn = document.getElementById('repeatBtn');
const studyButton = document.getElementById('studyButton');
const closeModalBtn = document.querySelector('.close');
const closeCreateBtn = document.querySelector('.close-create');
const saveCardButton = document.getElementById('saveCardButton');
const saveTopicButton = document.getElementById('saveTopicButton');
const saveLessonButton = document.getElementById('saveLessonButton');
const authScreen = document.getElementById('authScreen');

// --- СИСТЕМА РЕГИСТРАЦИИ/АВТОРИЗАЦИИ ---
let isLoginMode = true;

function showLoginForm() {
    isLoginMode = true;
    document.getElementById('authTitle').innerText = 'Вход';
    const formHtml = `
        <input type="text" id="authName" placeholder="Имя" required style="width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <input type="password" id="authPass" placeholder="Пароль" required style="width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <button type="submit" class="btn-primary" style="width: 100%; cursor: pointer;">Войти</button>
    `;
    document.getElementById('authForm').innerHTML = formHtml;
    document.getElementById('toggleAuthText').innerHTML = 'Нет аккаунта? <span style="color: #667eea; cursor: pointer;">Регистрация</span>';
}

function showRegisterForm() {
    isLoginMode = false;
    document.getElementById('authTitle').innerText = 'Регистрация';
    const formHtml = `
        <input type="text" id="authName" placeholder="Имя" required style="width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <input type="email" id="authEmail" placeholder="Email" required style="width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <input type="password" id="authPass" placeholder="Пароль" required style="width: 100%; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
        <button type="submit" class="btn-primary" style="width: 100%; cursor: pointer;">Зарегистрироваться</button>
    `;
    document.getElementById('authForm').innerHTML = formHtml;
    document.getElementById('toggleAuthText').innerHTML = 'Уже есть аккаунт? <span style="color: #667eea; cursor: pointer;">Войти</span>';
}

function handleAuthSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('authName').value.trim();
    const password = document.getElementById('authPass').value;
    
    if (isLoginMode) {
        // Вход
        const user = users.find(u => u.name === name && u.password === password);
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            loadUserData();
            authScreen.style.display = 'none';
            renderProfileTab();
            showNotification(`Добро пожаловать, ${user.name}!`, 'success');
        } else {
            showNotification('Неверное имя или пароль!', 'error');
        }
    } else {
        // Регистрация
        const email = document.getElementById('authEmail').value.trim();
        if (users.find(u => u.name === name)) {
            showNotification('Пользователь с таким именем уже существует!', 'error');
            return;
        }
        if (users.find(u => u.email === email)) {
            showNotification('Пользователь с таким email уже существует!', 'error');
            return;
        }
        
        const newUser = {
            id: Date.now(),
            name: name,
            email: email,
            password: password,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        loadUserData();
        authScreen.style.display = 'none';
        renderProfileTab();
        showNotification(`Регистрация прошла успешно! Добро пожаловать, ${name}!`, 'success');
    }
}

function toggleAuthMode() {
    if (isLoginMode) {
        showRegisterForm();
    } else {
        showLoginForm();
    }
}

// Загрузка данных пользователя
function loadUserData() {
    if (!currentUser) return;
    
    const savedTopics = localStorage.getItem(`userTopics_${currentUser.id}`);
    const savedLessons = localStorage.getItem(`userLessons_${currentUser.id}`);
    const savedCards = localStorage.getItem(`userCards_${currentUser.id}`);
    const savedRepetition = localStorage.getItem(`repetitionDecks_${currentUser.id}`);
    const savedSettings = localStorage.getItem(`appSettings_${currentUser.id}`);
    const savedProgress = localStorage.getItem(`lessonProgress_${currentUser.id}`);
    const savedRecent = localStorage.getItem(`recentWords_${currentUser.id}`);
    
    if (savedTopics) userTopics = JSON.parse(savedTopics);
    if (savedLessons) userLessons = JSON.parse(savedLessons);
    if (savedCards) userCards = JSON.parse(savedCards);
    if (savedRepetition) repetitionDecks = JSON.parse(savedRepetition);
    if (savedSettings) appSettings = JSON.parse(savedSettings);
    if (savedProgress) lessonProgress = JSON.parse(savedProgress);
    if (savedRecent) recentWords = JSON.parse(savedRecent);
    
    updateTopicSelects();
    renderRecentWords();
}

// Сохранение данных пользователя
function saveUserData() {
    if (!currentUser) return;
    
    localStorage.setItem(`userTopics_${currentUser.id}`, JSON.stringify(userTopics));
    localStorage.setItem(`userLessons_${currentUser.id}`, JSON.stringify(userLessons));
    localStorage.setItem(`userCards_${currentUser.id}`, JSON.stringify(userCards));
    localStorage.setItem(`repetitionDecks_${currentUser.id}`, JSON.stringify(repetitionDecks));
    localStorage.setItem(`appSettings_${currentUser.id}`, JSON.stringify(appSettings));
    localStorage.setItem(`lessonProgress_${currentUser.id}`, JSON.stringify(lessonProgress));
    localStorage.setItem(`recentWords_${currentUser.id}`, JSON.stringify(recentWords));
}

// Выход из аккаунта
function logout() {
    saveUserData();
    currentUser = null;
    localStorage.removeItem('currentUser');
    userTopics = [];
    userLessons = [];
    userCards = [];
    repetitionDecks = {
        forgot: { name: "Не запомнил", cards: [], interval: 1 },
        normal: { name: "Нормально", cards: [], interval: 12 },
        good: { name: "Хорошо", cards: [], interval: 24 },
        great: { name: "Отлично", cards: [], interval: 96 }
    };
    appSettings = { forgot: 1, normal: 12, good: 24, great: 96 };
    lessonProgress = {};
    recentWords = [];
    studyActive = false;
    
    showLoginForm();
    authScreen.style.display = 'flex';
}

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ handleRating ---
function handleRating(rating) {
    if (!currentCardData) return;

    // Сохраняем прогресс урока
    const currentTopic = document.getElementById('topicSelect')?.value || 'unknown';
    const currentLesson = document.getElementById('lessonSelect')?.value || 'unknown';
    const lessonKey = `${currentTopic}_lesson_${currentLesson}`;
    
    if (!lessonProgress[lessonKey]) {
        lessonProgress[lessonKey] = {
            topic: currentTopic,
            lesson: currentLesson,
            cardsStudied: 0,
            lastStudied: Date.now()
        };
    }
    lessonProgress[lessonKey].cardsStudied++;
    lessonProgress[lessonKey].lastStudied = Date.now();
    saveUserData();

    // Создаем копию карточки для повторения (без example)
    const cardToRepeat = { 
        ...currentCardData, 
        lastRated: Date.now(),
        word: currentCardData.word,
        translation: currentCardData.translation,
        image: currentCardData.image
    };
    
    repetitionDecks[rating].cards.push(cardToRepeat);
    saveUserData();
    
    showNotification(`Слово "${currentCardData.word}" добавлено в колоду "${repetitionDecks[rating].name}"`);
}

// Проверка: пора ли повторять колоду?
function isTimeUp(deckKey) {
    const deck = repetitionDecks[deckKey];
    if (deck.cards.length === 0) return false;
    
    const lastCardTime = Math.min(...deck.cards.map(c => c.lastRated));
    const hoursPassed = (Date.now() - lastCardTime) / (1000 * 60 * 60);
    
    return hoursPassed >= (appSettings[deckKey] || deck.interval);
}

// Рендер блоков повторения
function renderRepetitionBlocks() {
    const colors = {
        forgot: { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', border: '#ff4b5c', text: '#721c24' },
        normal: { bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', border: '#4c9aff', text: '#1a3a6b' },
        good: { bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', border: '#2ecc71', text: '#1a5c2e' },
        great: { bg: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', border: '#9b59b6', text: '#4a1a6b' }
    };
    
    return `
    <div class="repetition-container" style="margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 20px;">
        <h3 style="margin-bottom: 20px; font-size: 1.2rem; color: #2d3748;">Система повторений</h3>
        <div style="display: flex; flex-direction: column; gap: 12px;">
            ${Object.keys(repetitionDecks).map(key => {
                const deck = repetitionDecks[key];
                const active = isTimeUp(key);
                const interval = appSettings[key] || deck.interval;
                const color = colors[key];
                
                return `
                <div class="rep-card" 
                     style="background: ${active ? color.bg : '#f8f9fa'}; 
                            padding: 16px 20px;
                            border-radius: 14px; 
                            border: 2px solid ${active ? color.border : '#e2e8f0'};
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            flex-wrap: wrap;
                            gap: 15px;">
                    
                    <div style="flex: 2; min-width: 150px;">
                        <div style="font-weight: bold; font-size: 1rem; margin-bottom: 5px; color: ${active ? color.text : '#2d3748'};">
                            ${deck.name}
                        </div>
                        <div style="font-size: 0.75rem; color: ${active ? color.text : '#718096'};">
                            Интервал: ${interval} ч
                        </div>
                    </div>
                    
                    <div style="text-align: center; min-width: 70px;">
                        <div style="font-size: 1.3rem; font-weight: bold; color: ${active ? color.text : '#4a5568'};">
                            ${deck.cards.length}
                        </div>
                        <div style="font-size: 0.65rem; color: ${active ? color.text : '#718096'};">
                            карточек
                        </div>
                    </div>
                    
                    <button onclick="startRepetition('${key}')" 
                            style="padding: 8px 18px; 
                                   font-size: 0.85rem; 
                                   font-weight: 600;
                                   border-radius: 10px;
                                   border: none;
                                   cursor: pointer;
                                   background: ${active ? '#2c3e50' : '#cbd5e0'};
                                   color: ${active ? 'white' : '#718096'};
                                   min-width: 110px;"
                            ${deck.cards.length === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        ${active ? '🔔 ПОВТОРИТЬ' : '📚 Повторить'}
                    </button>
                </div>
                `;
            }).join('')}
        </div>
    </div>
    `;
}

// Запуск повторения
function startRepetition(deckKey) {
    const deck = repetitionDecks[deckKey];
    if (deck.cards.length === 0) {
        showNotification(`В колоде "${deck.name}" нет карточек для повторения`, 'error');
        return;
    }

    showNotification(`Начинаем повторение колоды "${deck.name}" (${deck.cards.length} карточек)`, 'success');
    
    currentDeck = [...deck.cards];
    repetitionDecks[deckKey].cards = [];
    saveUserData();

    currentCardIndex = 0;
    currentCardData = currentDeck[0];
    answerRevealed = false;
    currentRating = null;
    studyActive = true;
    
    renderFlashcard();
}

function renderProfileTab() {
    const studiedLessons = Object.keys(lessonProgress).length;
    
    let totalCardsStudied = 0;
    Object.values(lessonProgress).forEach(progress => {
        totalCardsStudied += progress.cardsStudied || 0;
    });
    
    let cardsInRepetition = 0;
    Object.values(repetitionDecks).forEach(deck => {
        cardsInRepetition += deck.cards.length;
    });
    
    mainContentDiv.innerHTML = `
      <div class="welcome-screen" style="max-width: 700px; margin: 0 auto;">
        <span class="welcome-icon">👤</span>
        <h2>Профиль: ${currentUser.name}</h2>
        
        <div style="display: flex; justify-content: space-around; margin: 20px 0; gap: 15px; flex-wrap: wrap;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 12px; flex: 1; min-width: 100px;">
                <div style="font-size: 1.8rem; font-weight: bold;">${studiedLessons}</div>
                <div style="font-size: 0.8rem;">Уроков пройдено</div>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px; border-radius: 12px; flex: 1; min-width: 100px;">
                <div style="font-size: 1.8rem; font-weight: bold;">${totalCardsStudied}</div>
                <div style="font-size: 0.8rem;">Карточек изучено</div>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px; border-radius: 12px; flex: 1; min-width: 100px;">
                <div style="font-size: 1.8rem; font-weight: bold;">${cardsInRepetition}</div>
                <div style="font-size: 0.8rem;">Ждут повторения</div>
            </div>
        </div>
        
        ${renderRepetitionBlocks()}
        
        <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
            <button class="btn-start" onclick="openDeckModal()" style="margin: 0;">Новое обучение</button>
            <button class="logout-btn" onclick="logout()" style="margin: 0;">Выйти</button>
        </div>
      </div>
    `;
    studyActive = false;
}

// Настройки
function renderSettingsTab() {
    mainContentDiv.innerHTML = `
      <div class="welcome-screen" style="max-width: 500px; margin: 0 auto;">
        <h2>Настройки интервалов</h2>
        <div style="text-align: left; background: #f7fafc; padding: 20px; border-radius: 16px; margin: 20px 0;">
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>🔴 Не запомнил:</span>
                    <input type="number" id="settingForgot" value="${appSettings.forgot}" style="width: 80px; padding: 5px; border-radius: 8px; border: 1px solid #cbd5e0;">
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>🟡 Нормально:</span>
                    <input type="number" id="settingNormal" value="${appSettings.normal}" style="width: 80px; padding: 5px; border-radius: 8px; border: 1px solid #cbd5e0;">
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>🟢 Хорошо:</span>
                    <input type="number" id="settingGood" value="${appSettings.good}" style="width: 80px; padding: 5px; border-radius: 8px; border: 1px solid #cbd5e0;">
                </label>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>🟣 Отлично:</span>
                    <input type="number" id="settingGreat" value="${appSettings.great}" style="width: 80px; padding: 5px; border-radius: 8px; border: 1px solid #cbd5e0;">
                </label>
            </div>
            <button id="saveSettingsBtn" class="btn-primary">Сохранить</button>
        </div>
      </div>
    `;
    
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
        appSettings.forgot = parseInt(document.getElementById('settingForgot').value) || 1;
        appSettings.normal = parseInt(document.getElementById('settingNormal').value) || 12;
        appSettings.good = parseInt(document.getElementById('settingGood').value) || 24;
        appSettings.great = parseInt(document.getElementById('settingGreat').value) || 96;
        saveUserData();
        showNotification('Настройки сохранены!', 'success');
    });
    
    studyActive = false;
}

// --- ОСТАЛЬНЫЕ ФУНКЦИИ (с сохранением в пользовательское хранилище) ---
async function updateTopicSelects() {
    const topicSelects = ['topicSelect', 'lessonTopicSelect', 'cardTopicSelect'];
    const defaultTopics = [
        { id: 'food', name: 'Еда' },
        { id: 'travel', name: 'Путешествия'},
        { id: 'human_anatomy', name: 'Организм человека' },
        { id: 'animals', name: 'Животные' }
    ];
    
    const allTopics = [...defaultTopics, ...userTopics];
    
    topicSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '';
            allTopics.forEach(topic => {
                const option = document.createElement('option');
                option.value = topic.id;
                option.textContent = `${topic.icon || '📚'} ${topic.name}`;
                select.appendChild(option);
            });
            if (currentValue && allTopics.some(t => t.id === currentValue)) {
                select.value = currentValue;
            }
        }
    });
    
    // Обновляем выбор уроков для всех селектов
    const currentTopic = document.getElementById('topicSelect')?.value;
    if (currentTopic) {
        await updateDeckLessonSelect(currentTopic);
    }
    
    await updateLessonSelects();
}

async function updateLessonSelects() {
    const topic = document.getElementById('cardTopicSelect')?.value;
    const lessonSelect = document.getElementById('cardLessonSelect');
    if (!lessonSelect) return;
    
    const currentValue = lessonSelect.value;
    
    // Получаем доступные уроки из JSON
    const availableLessons = await getAvailableLessons(topic);
    const userLessonsForTopic = userLessons.filter(l => l.topicId === topic);
    
    lessonSelect.innerHTML = '';
    
    // Добавляем уроки из JSON
    availableLessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.number;
        option.textContent = `${lesson.name}`;
        lessonSelect.appendChild(option);
    });
    
    // Добавляем пользовательские уроки
    userLessonsForTopic.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.number;
        option.textContent = `${lesson.name}`;
        lessonSelect.appendChild(option);
    });
    
    if (currentValue) lessonSelect.value = currentValue;
}

async function updateDeckLessonSelect(topicId) {
    const lessonSelect = document.getElementById('lessonSelect');
    if (!lessonSelect) return;
    
    const currentValue = lessonSelect.value;
    
    // Получаем доступные уроки из JSON файлов
    const availableLessons = await getAvailableLessons(topicId);
    
    // Добавляем пользовательские уроки
    const userLessonsForTopic = userLessons.filter(l => l.topicId === topicId);
    
    lessonSelect.innerHTML = '';
    
    // Добавляем уроки из JSON
    availableLessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.number;
        option.textContent = `📚 ${lesson.name}`;
        lessonSelect.appendChild(option);
    });
    
    // Добавляем пользовательские уроки
    userLessonsForTopic.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.number;
        option.textContent = `✨ ${lesson.name}`;
        lessonSelect.appendChild(option);
    });
    
    if (currentValue && (availableLessons.some(l => l.number == currentValue) || userLessonsForTopic.some(l => l.number == currentValue))) {
        lessonSelect.value = currentValue;
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="notification-message">${message}</span>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function createTopic() {
    const name = document.getElementById('topicName').value.trim();
    const icon = document.getElementById('topicIcon').value.trim() || '📚';
    const description = document.getElementById('topicDescription').value.trim();
    
    if (!name) {
        showNotification('Введите название темы', 'error');
        return;
    }
    
    const topicId = name.toLowerCase().replace(/[^a-zа-яё]/g, '_');
    
    if (userTopics.some(t => t.id === topicId) || 
        ['food', 'travel', 'human_anatomy', 'animals'].includes(topicId)) {
        showNotification('Тема с таким названием уже существует', 'error');
        return;
    }
    
    userTopics.push({
        id: topicId, name: name, icon: icon, description: description,
        isUserCreated: true, createdAt: new Date().toISOString()
    });
    saveUserData();
    updateTopicSelects();
    
    document.getElementById('topicName').value = '';
    document.getElementById('topicIcon').value = '';
    document.getElementById('topicDescription').value = '';
    
    showNotification(`Тема "${name}" создана!`);
}

function createLesson() {
    const topicId = document.getElementById('lessonTopicSelect').value;
    const name = document.getElementById('lessonName').value.trim();
    const number = parseInt(document.getElementById('lessonNumber').value);
    const description = document.getElementById('lessonDescription').value.trim();
    
    if (!name) {
        showNotification('Введите название урока', 'error');
        return;
    }
    
    if (userLessons.some(l => l.topicId === topicId && l.number === number)) {
        showNotification(`Урок ${number} уже существует`, 'error');
        return;
    }
    
    userLessons.push({
        id: `${topicId}_lesson_${number}`,
        topicId: topicId, name: name, number: number, description: description,
        isUserCreated: true, createdAt: new Date().toISOString()
    });
    saveUserData();
    updateLessonSelects();
    updateDeckLessonSelect(topicId);
    
    document.getElementById('lessonName').value = '';
    document.getElementById('lessonNumber').value = '1';
    document.getElementById('lessonDescription').value = '';
    
    showNotification(`Урок "${name}" создан!`);
}

function createCard() {
    const topic = document.getElementById('cardTopicSelect').value;
    const lesson = document.getElementById('cardLessonSelect').value;
    const word = document.getElementById('cardWord').value.trim();
    const translation = document.getElementById('cardTranslation').value.trim();
    const imageFile = document.getElementById('cardImageFile').files[0];
    
    if (!word || !translation) {
        showNotification('Заполните слово и перевод', 'error');
        return;
    }
    
    userCards.push({
        id: Date.now(), 
        topic: topic, 
        lesson: parseInt(lesson),
        word: word, 
        translation: translation, 
        image: imageFile ? URL.createObjectURL(imageFile) : null,
        createdAt: new Date().toISOString()
    });
    saveUserData();
    
    document.getElementById('cardWord').value = '';
    document.getElementById('cardTranslation').value = '';
    document.getElementById('cardImageFile').value = '';
    
    showNotification(`Карточка "${word}" создана!`);
}

async function loadDeck(topic, lesson) {
    const lessonNum = parseInt(lesson);
    let cards = [];
    
    console.log(`Загружаем колоду: ${topic}, урок ${lessonNum}`);
    console.log(`Путь: data/topics/${topic}/lesson_${lessonNum}.json`);
    
    try {
        const response = await fetch(`data/topics/${topic}/lesson_${lessonNum}.json`);
        console.log(`Статус ответа: ${response.status}`);
        
        if (response.ok) {
            const lessonData = await response.json();
            cards = lessonData.cards;
            console.log(`✅ Загружено ${cards.length} карточек из JSON`);
            if (cards.length > 0) {
                console.log(`Первая карточка: ${cards[0].word} -> ${cards[0].translation}`);
            }
        } else {
            console.warn(`⚠️ Файл не найден: data/topics/${topic}/lesson_${lessonNum}.json`);
        }
    } catch (error) {
        console.error(`❌ Ошибка загрузки JSON:`, error);
    }
    
    // Добавляем пользовательские карточки
    const userCardsForLesson = userCards.filter(c => 
        c.topic === topic && c.lesson === lessonNum
    );
    
    if (userCardsForLesson.length > 0) {
        console.log(`👤 Добавлено ${userCardsForLesson.length} пользовательских карточек`);
        userCardsForLesson.forEach(card => {
            cards.push({
                id: card.id,
                word: card.word,
                translation: card.translation,
                image: card.image || `photo/${topic}/placeholder.jpg`,
                example: card.example
            });
        });
    }
    
    // Запасной вариант
    if (cards.length === 0) {
        console.warn(`Нет карточек, используем запасной вариант`);
        const fallbackCards = {
            food: [{ id: 1, word: "мясо", translation: "meat", image: "photo/food/1.jpg", example: "Я люблю есть мясо" }],
            travel: [{ id: 1, word: "самолет", translation: "airplane", image: "photo/travel/1.jpg", example: "Самолет летит быстро" }],
            human_anatomy: [{ id: 1, word: "голова", translation: "head", image: "photo/human_anatomy/1.jpg", example: "У меня болит голова" }],
            animals: [{ id: 1, word: "собака", translation: "dog", image: "photo/animals/1.jpg", example: "Собака друг человека" }]
        };
        cards = fallbackCards[topic] || fallbackCards.food;
    }
    
    console.log(`Итого карточек: ${cards.length}`);
    return cards;
}



function renderFlashcard() {
    if (!studyActive || !currentCardData) {
        mainContentDiv.innerHTML = `
            <div class="welcome-screen">
                <span class="welcome-icon">📚</span>
                <h2>Выберите тему для изучения</h2>
                <p>Нажмите кнопку "Учить" или выберите колоду</p>
                <button class="btn-start" id="startBtn">Начать обучение</button>
            </div>
        `;
        document.getElementById('startBtn')?.addEventListener('click', openDeckModal);
        return;
    }

    const card = currentCardData;
    const imagePath = card.image || `photo/food/placeholder.jpg`;
    
    const showAnswerHtml = !answerRevealed ? 
        `<button class="show-answer-btn" id="revealAnswerBtn">Показать ответ</button>` : 
        `<div class="answer-word">${card.word} → ${card.translation}</div>`;

    const ratingHTML = answerRevealed ? `
        <div class="rating-section">
            <div class="rating-title">Как вы запомнили слово?</div>
            <div class="rating-buttons">
                <button class="rating-btn" data-rating="forgot">1. не запомнил</button>
                <button class="rating-btn" data-rating="normal">2. нормально</button>
                <button class="rating-btn" data-rating="good">3. хорошо</button>
                <button class="rating-btn" data-rating="great">4. отлично</button>
            </div>
        </div>
    ` : '';

    mainContentDiv.innerHTML = `
        <div class="flashcard-container">
            <div class="image-area">
                <img class="card-img" src="${imagePath}" alt="Vocabulary" 
                     onerror="this.src='https://via.placeholder.com/400x300?text=${encodeURIComponent(card.word)}'">
            </div>
            ${showAnswerHtml}
            ${ratingHTML}
            ${answerRevealed ? '<button class="next-btn" id="nextCardBtn">→ Далее</button>' : ''}
            <div class="info-message">Карточка ${currentCardIndex + 1} из ${currentDeck.length}</div>
        </div>
    `;

    document.getElementById('revealAnswerBtn')?.addEventListener('click', () => {
        answerRevealed = true;
        renderFlashcard();
    });

    if (answerRevealed) {
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                handleRating(btn.getAttribute('data-rating'));
                addRecentWord(currentCardData.word);
            });
        });

        document.getElementById('nextCardBtn')?.addEventListener('click', () => {
            if (currentCardIndex + 1 < currentDeck.length) {
                currentCardIndex++;
                currentCardData = currentDeck[currentCardIndex];
                answerRevealed = false;
                currentRating = null;
                renderFlashcard();
            } else {
                studyActive = false;
                mainContentDiv.innerHTML = `
                    <div class="welcome-screen">
                        <span class="welcome-icon">🎉</span>
                        <h2>Поздравляем!</h2>
                        <p>Вы завершили изучение колоды</p>
                        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
                            <button class="btn-start" onclick="openDeckModal()" style="margin: 0;">Новая колода</button>
                            <button class="btn-start" onclick="renderProfileTab()" style="margin: 0;">Профиль</button>
                        </div>
                    </div>
                `;
            }
        });
    }
}

function addRecentWord(word) {
    recentWords.unshift({ word, timestamp: Date.now() });
    if (recentWords.length > 5) recentWords.pop();
    saveUserData();
    renderRecentWords();
}

function renderRecentWords() {
    const container = document.getElementById('recentWordsList');
    if (!container) return;
    
    if (recentWords.length === 0) {
        container.innerHTML = `<div class="word-block empty"><p>Здесь появятся последние изученные слова</p></div>`;
        return;
    }
    
    container.innerHTML = recentWords.map(item => `<div class="word-block real"> ${item.word}</div>`).join('');
}

function openDeckModal() {
    const modal = document.getElementById('deckModal');
    if (modal) modal.style.display = 'flex';
    studyActive = false;
}

function closeModal() {
    const modal = document.getElementById('deckModal');
    if (modal) modal.style.display = 'none';
}

// Исправленная функция startStudy с диагностикой
async function startStudy() {
    const topic = document.getElementById('topicSelect').value;
    const lesson = document.getElementById('lessonSelect').value;
    
    console.log(`Начинаем изучение: тема=${topic}, урок=${lesson}`);
    
    mainContentDiv.innerHTML = `<div class="loading"><div class="loading-spinner"></div><p>Загрузка колоды...</p></div>`;
    
    try {
        currentDeck = await loadDeck(topic, lesson);
        
        if (!currentDeck || currentDeck.length === 0) {
            throw new Error('Колода пуста');
        }
        
        console.log(`✅ Успешно загружено ${currentDeck.length} карточек`);
        
        currentCardIndex = 0;
        currentCardData = currentDeck[0];
        answerRevealed = false;
        currentRating = null;
        studyActive = true;
        
        closeModal();
        renderFlashcard();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        mainContentDiv.innerHTML = `
            <div class="welcome-screen">
                <span class="welcome-icon"></span>
                <h2>Ошибка загрузки</h2>
                <p>Не удалось загрузить колоду: ${error.message}</p>
                <p style="font-size: 0.8rem; color: #666;">Проверьте консоль (F12) для деталей</p>
                <button class="btn-start" onclick="openDeckModal()">Попробовать снова</button>
            </div>
        `;
    }
}


function initCreateTabs() {
    const tabs = document.querySelectorAll('.create-tab');
    const contents = document.querySelectorAll('.create-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-create-tab');
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`create${tabId.charAt(0).toUpperCase() + tabId.slice(1)}Tab`)?.classList.add('active');
        });
    });
}

// Инициализация
async function init() {
    showLoginForm();
    
    document.getElementById('authForm').addEventListener('submit', handleAuthSubmit);
    document.getElementById('toggleAuthText').addEventListener('click', toggleAuthMode);
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        const existingUser = users.find(u => u.id === user.id);
        if (existingUser) {
            currentUser = existingUser;
            loadUserData();
            authScreen.style.display = 'none';
            renderProfileTab();
        }
    }
    
    renderRecentWords();
    initCreateTabs();

    studySidebarBtn?.addEventListener('click', openDeckModal);
    studyButton?.addEventListener('click', startStudy);
    closeModalBtn?.addEventListener('click', closeModal);
    closeCreateBtn?.addEventListener('click', () => {
        document.getElementById('createCardModal').style.display = 'none';
    });

    saveCardButton?.addEventListener('click', createCard);
    saveTopicButton?.addEventListener('click', createTopic);
    saveLessonButton?.addEventListener('click', createLesson);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!currentUser) return;
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const tab = link.getAttribute('data-tab');
            
            if (tab === 'decks') openDeckModal();
            else if (tab === 'create') document.getElementById('createCardModal').style.display = 'flex';
            else if (tab === 'settings') renderSettingsTab();
            else if (tab === 'profile') renderProfileTab();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('deckModal')) closeModal();
        if (e.target === document.getElementById('createCardModal')) document.getElementById('createCardModal').style.display = 'none';
    });
}

init();