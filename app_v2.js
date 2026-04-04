/**
 * AI Fortune App Main Scripts
 * Features: Fortune Analysis, Cosmic Dialogue, Compatibility, Talisman, Share Card
 */

const API_KEY = "AIzaSyABTUYfJfWtZo0Q0ec1a4mv_WUuH2LQlho";
const MODEL_NAME = "gemini-2.5-flash";

class FortuneApp {
    constructor() {
        // Fortune elements
        this.form = document.getElementById('fortune-form');
        this.inputSection = document.getElementById('input-section');
        this.loadingSection = document.getElementById('loading-section');
        this.resultSection = document.getElementById('result-section');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.retryBtn = document.getElementById('retry-btn');

        // Chat elements
        this.chatInput = document.getElementById('chat-input');
        this.chatSendBtn = document.getElementById('chat-send-btn');
        this.chatMessages = document.getElementById('chat-messages');

        // Mode navigation
        this.modeBtns = document.querySelectorAll('.mode-btn');

        // Compatibility elements
        this.compatForm = document.getElementById('compat-form');
        this.compatInputSection = document.getElementById('compat-input-section');
        this.compatLoadingSection = document.getElementById('compat-loading-section');
        this.compatResultSection = document.getElementById('compat-result-section');
        this.compatRetryBtn = document.getElementById('compat-retry-btn');

        // Context storage
        this.lastAnalysisResult = null;
        this.lastFormData = null;
        this.currentMode = 'fortune';

        this.initEventListeners();
    }

    initEventListeners() {
        // Fortune form
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startAnalysis();
        });

        // Tabs
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.getAttribute('data-tab'));
            });
        });

        this.retryBtn.addEventListener('click', () => this.showSection('input'));

        // Chat
        this.chatSendBtn.addEventListener('click', () => this.handleChat());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleChat();
        });

        // Mode navigation
        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchMode(btn.dataset.mode));
        });

        // Compatibility
        this.compatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startCompatAnalysis();
        });
        this.compatRetryBtn.addEventListener('click', () => this.showCompatSection('input'));

        // Talisman save
        document.getElementById('save-talisman-btn').addEventListener('click', () => this.saveTalisman());

        // Share card buttons
        document.getElementById('download-share-btn').addEventListener('click', () => this.downloadShareCard());
        document.getElementById('copy-share-btn').addEventListener('click', () => this.copyShareCard());
    }

    // ==================== MODE SWITCHING ====================
    switchMode(mode) {
        this.currentMode = mode;
        this.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Hide everything first
        this.hideAllSections();

        if (mode === 'fortune') {
            this.inputSection.classList.remove('hidden');
        } else if (mode === 'compat') {
            this.compatInputSection.classList.remove('hidden');
        }
    }

    hideAllSections() {
        [this.inputSection, this.loadingSection, this.resultSection,
         this.compatInputSection, this.compatLoadingSection, this.compatResultSection
        ].forEach(s => s.classList.add('hidden'));
    }

    // ==================== FORTUNE ANALYSIS ====================
    async startAnalysis() {
        const formData = {
            name: document.getElementById('userName').value,
            birthDate: document.getElementById('birthDate').value,
            birthTime: document.getElementById('birthTime').value,
            gender: document.querySelector('input[name="gender"]:checked').value,
            calendar: document.querySelector('input[name="calendar"]:checked').value
        };

        this.showSection('loading');

        try {
            const analysisData = this.calculateBaseData(formData);
            const prompt = this.generatePrompt(formData, analysisData);
            const result = await this.callGemini(prompt);

            this.lastAnalysisResult = result;
            this.lastFormData = formData;
            this.resetChat();

            this.renderResult(formData.name, analysisData, result);
            this.drawTalisman(formData, result);
            this.drawShareCard(formData, result);
            this.showSection('result');
        } catch (error) {
            console.error("🔴 Analysis Failed:", error);
            alert(`운세 분석 중 오류가 발생했습니다: ${error.message}\n잠시 후 다시 시도해주세요.`);
            this.showSection('input');
        }
    }

    calculateBaseData(formData) {
        const year = new Date(formData.birthDate).getFullYear();
        return {
            zodiacSign: FortuneEngine.getZodiacSign(formData.birthDate),
            lifePath: FortuneEngine.getLifePathNumber(formData.birthDate),
            orientalZodiac: FortuneEngine.getOrientalZodiac(year),
            ganji: FortuneEngine.getYearlyGanji(year),
            tarot: FortuneEngine.getRandomTarot()
        };
    }

    generatePrompt(formData, analysisData) {
        return `
        당신은 동서양 운세 전문가입니다. 아래 사용자 정보를 바탕으로 오늘의 복합 운세 분석해주세요.
        
        [사용자 정보]
        - 이름: ${formData.name} (${formData.gender == 'male' ? '남성' : '여성'})
        - 생년월일: ${formData.birthDate} (${formData.calendar == 'solar' ? '양력' : '음력'})
        - 태어난 시각: ${formData.birthTime}
        
        [시스템 계산값]
        - 서양 별자리: ${analysisData.zodiacSign}
        - 수비학 생명수: ${analysisData.lifePath}
        - 타로 카드: ${analysisData.tarot}
        - 동양 사주간지: ${analysisData.ganji}
        - 12간지: ${analysisData.orientalZodiac}
        
        [출력 양식 (JSON 형식으로만 답변하세요)]
        {
            "totalScore": 1~100 사이 숫자,
            "summary": "오늘의 짧은 요약 문구",
            "love": "애정운 상세 내용",
            "money": "금전운 상세 내용",
            "work": "직업/학업운 상세 내용",
            "health": "건강운 상세 내용",
            "aiAdvice": "동서양을 복합적으로 분석한 깊이 있는 조언 (작성 시 사용자의 생년월일 특성에 기반하여 결과가 일관되게 작성될 수 있도록 주의하세요)",
            "orientalDetail": "동양 철학(사주, 오행 등) 관점의 분석 내용",
            "westernDetail": "서양 점성술/타로 관점의 분석 내용",
            "luckyNum": "숫자 1개",
            "luckyColor": "색상 이름",
            "luckyDir": "동/서/남/북 등 방향",
            "lottoNumbers": [1, 2, 3, 4, 5, 6] (1~45 사이의 숫자 6개, 사용자의 생년월일 기운에 따른 고정적인 추천 조합)
        }
        
        [특별 지침]
        1. 결과의 일관성이 매우 중요합니다. 동일한 생년월일에 대해 매번 다른 결과가 나오지 않도록, 데이터에 기반한 논리적인 분석을 제공하세요.
        2. 로또 번호는 사용자의 생년월일 에너지를 분석하여 결정된 고유의 행운 번호여야 합니다.
        3. 한국어로 답변하세요.
        `;
    }

    async callGemini(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Detail:", errorData);
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("응답에서 데이터를 찾을 수 없습니다.");
            return JSON.parse(jsonMatch[0].trim());
        } catch (e) {
            console.error("JSON Parsing Error:", e, "Raw:", text);
            throw new Error("분석 데이터를 처리하는 중 오류가 발생했습니다.");
        }
    }

    async callGeminiText(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) throw new Error(`API failed: ${response.status}`);
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    renderResult(userName, analysisData, result) {
        document.getElementById('res-name').innerText = userName;
        document.getElementById('totalScore').innerText = result.totalScore;
        document.getElementById('res-summary').innerText = result.summary;
        document.getElementById('love-fortune').innerText = result.love;
        document.getElementById('money-fortune').innerText = result.money;
        document.getElementById('work-fortune').innerText = result.work;
        document.getElementById('health-fortune').innerText = result.health;
        document.getElementById('ai-advice').innerText = result.aiAdvice;

        document.getElementById('saju-data').innerText = analysisData.ganji;
        document.getElementById('zodiac-data').innerText = analysisData.orientalZodiac;
        document.getElementById('oriental-content').innerText = result.orientalDetail;
        document.getElementById('star-data').innerText = analysisData.zodiacSign;
        document.getElementById('num-data').innerText = analysisData.lifePath;
        document.getElementById('western-content').innerText = result.westernDetail;

        document.getElementById('lucky-num').innerText = result.luckyNum;
        document.getElementById('lucky-color').innerText = result.luckyColor;
        document.getElementById('lucky-dir').innerText = result.luckyDir;

        const lottoContainer = document.getElementById('lotto-numbers');
        if (lottoContainer && result.lottoNumbers) {
            lottoContainer.innerHTML = result.lottoNumbers.map(num => `<span>${num}</span>`).join('');
        }

        this.switchTab('total');
    }

    showSection(id) {
        this.inputSection.classList.add('hidden');
        this.loadingSection.classList.add('hidden');
        this.resultSection.classList.add('hidden');
        if (id === 'input') this.inputSection.classList.remove('hidden');
        if (id === 'loading') this.loadingSection.classList.remove('hidden');
        if (id === 'result') this.resultSection.classList.remove('hidden');
    }

    switchTab(tabId) {
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.add('hidden'));
        const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(`tab-${tabId}`);
        if (activeBtn) activeBtn.classList.add('active');
        if (activeContent) activeContent.classList.remove('hidden');
    }

    // ==================== COSMIC DIALOGUE (CHAT) ====================
    async handleChat() {
        const query = this.chatInput.value.trim();
        if (!query || !this.lastAnalysisResult) return;

        this.addChatMessage('user', query);
        this.chatInput.value = '';
        const loadingId = 'loading-' + Date.now();
        this.addChatMessage('ai', '우주의 기운에 물어보고 있습니다...', loadingId);

        try {
            const chatPrompt = `
                당신은 운세 전문가입니다. 이전에 다음과 같은 운세 결과를 분석했습니다:
                [분석 결과 요약]: ${this.lastAnalysisResult.summary}
                [상세 내용]: ${this.lastAnalysisResult.aiAdvice}
                
                사용자의 이름은 ${this.lastFormData.name}입니다.
                사용자가 위 결과에 대해 추가 질문을 했습니다: "${query}"
                
                위 분석 결과를 바탕으로 친절하고 깊이 있게 답변해주세요. 
                답변은 3-4문장 이내로 간결하면서도 통찰력 있게 작성하세요.
                한국어로 답변하세요.
            `;
            const reply = await this.callGeminiText(chatPrompt);
            this.updateChatMessage(loadingId, reply);
        } catch (error) {
            console.error("Chat Error:", error);
            this.updateChatMessage(loadingId, "죄송합니다. 우주의 기운과 연결이 잠시 끊겼습니다. 다시 질문해 주세요.");
        }
    }

    addChatMessage(role, text, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;
        if (id) msgDiv.id = id;
        msgDiv.innerText = text;
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    updateChatMessage(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = text;
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    resetChat() {
        this.chatMessages.innerHTML = '<div class="message ai-message">분석된 결과에 대해 궁금한 점이 있으신가요? 편하게 물어보세요!</div>';
        this.chatInput.value = '';
    }

    // ==================== COMPATIBILITY ANALYSIS ====================
    async startCompatAnalysis() {
        const person1 = {
            name: document.getElementById('compatName1').value,
            birth: document.getElementById('compatBirth1').value,
            gender: document.querySelector('input[name="compatGender1"]:checked').value
        };
        const person2 = {
            name: document.getElementById('compatName2').value,
            birth: document.getElementById('compatBirth2').value,
            gender: document.querySelector('input[name="compatGender2"]:checked').value
        };

        this.showCompatSection('loading');

        try {
            const y1 = new Date(person1.birth).getFullYear();
            const y2 = new Date(person2.birth).getFullYear();
            const data1 = {
                zodiac: FortuneEngine.getZodiacSign(person1.birth),
                lifePath: FortuneEngine.getLifePathNumber(person1.birth),
                oriental: FortuneEngine.getOrientalZodiac(y1),
                ganji: FortuneEngine.getYearlyGanji(y1)
            };
            const data2 = {
                zodiac: FortuneEngine.getZodiacSign(person2.birth),
                lifePath: FortuneEngine.getLifePathNumber(person2.birth),
                oriental: FortuneEngine.getOrientalZodiac(y2),
                ganji: FortuneEngine.getYearlyGanji(y2)
            };

            const prompt = `
            당신은 동서양 궁합 전문가입니다. 두 사람의 정보를 비교 분석하여 궁합을 알려주세요.

            [첫 번째 사람]
            - 이름: ${person1.name} (${person1.gender === 'male' ? '남' : '여'})
            - 생년월일: ${person1.birth}
            - 별자리: ${data1.zodiac}, 생명수: ${data1.lifePath}
            - 12간지: ${data1.oriental}, 간지: ${data1.ganji}

            [두 번째 사람]
            - 이름: ${person2.name} (${person2.gender === 'male' ? '남' : '여'})
            - 생년월일: ${person2.birth}
            - 별자리: ${data2.zodiac}, 생명수: ${data2.lifePath}
            - 12간지: ${data2.oriental}, 간지: ${data2.ganji}

            [출력 양식 (JSON 형식으로만 답변)]
            {
                "score": 1~100 사이 숫자,
                "summary": "궁합 한 줄 요약",
                "love": "연애 궁합 상세 분석",
                "personality": "성격 궁합 상세 분석",
                "communication": "소통 궁합 상세 분석",
                "future": "미래 전망 상세 분석",
                "advice": "두 사람을 위한 종합 조언 (아주 상세하고 깊이 있게)"
            }

            [지침]
            1. 동양(사주, 오행, 띠 궁합)과 서양(별자리, 수비학)을 모두 복합 분석하세요.
            2. 결과의 일관성이 중요합니다. 같은 조합에 같은 점수를 내야 합니다.
            3. 한국어로 답변하세요.
            `;

            const result = await this.callGemini(prompt);
            this.renderCompatResult(person1.name, person2.name, result);
            this.showCompatSection('result');
        } catch (error) {
            console.error("Compat Error:", error);
            alert(`궁합 분석 중 오류가 발생했습니다: ${error.message}`);
            this.showCompatSection('input');
        }
    }

    renderCompatResult(name1, name2, result) {
        document.getElementById('compat-res-name1').innerText = name1;
        document.getElementById('compat-res-name2').innerText = name2;
        document.getElementById('compatScore').innerText = result.score;
        document.getElementById('compat-summary').innerText = result.summary;
        document.getElementById('compat-love').innerText = result.love;
        document.getElementById('compat-personality').innerText = result.personality;
        document.getElementById('compat-communication').innerText = result.communication;
        document.getElementById('compat-future').innerText = result.future;
        document.getElementById('compat-advice').innerText = result.advice;
    }

    showCompatSection(id) {
        this.compatInputSection.classList.add('hidden');
        this.compatLoadingSection.classList.add('hidden');
        this.compatResultSection.classList.add('hidden');
        if (id === 'input') this.compatInputSection.classList.remove('hidden');
        if (id === 'loading') this.compatLoadingSection.classList.remove('hidden');
        if (id === 'result') this.compatResultSection.classList.remove('hidden');
    }

    // ==================== TALISMAN (행운의 부적) ====================
    drawTalisman(formData, result) {
        const canvas = document.getElementById('talisman-canvas');
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        // Color palette based on lucky color
        const colorMap = {
            '빨강': '#e74c3c', '파랑': '#3498db', '노랑': '#f1c40f', '초록': '#2ecc71',
            '보라': '#9b59b6', '주황': '#e67e22', '분홍': '#e91e63', '화이트': '#ecf0f1',
            '검정': '#2c3e50', '금': '#f39c12', '은': '#bdc3c7'
        };
        const baseColor = colorMap[result.luckyColor] || '#8a2be2';

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#0d0221');
        grad.addColorStop(0.5, '#150533');
        grad.addColorStop(1, '#0d0221');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Border ornament
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        const m = 12;
        this.roundRect(ctx, m, m, W - m * 2, H - m * 2, 16);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,215,0,0.3)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, m + 4, m + 4, W - (m + 4) * 2, H - (m + 4) * 2, 14);
        ctx.stroke();

        // Sacred geometry - central mandala
        const cx = W / 2, cy = H / 2 - 10;
        const rings = [70, 55, 40, 25];
        rings.forEach((r, i) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `${baseColor}${['66', '88', 'aa', 'ff'][i]}`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Star pattern inside mandala
        const points = 8;
        const outerR = 60, innerR = 30;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI * 2 * i) / (points * 2) - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = `${baseColor}22`;
        ctx.fill();
        ctx.strokeStyle = `${baseColor}cc`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Zodiac symbol in center
        const zodiacSymbols = {
            '양자리': '♈', '황소자리': '♉', '쌍둥이자리': '♊', '게자리': '♋',
            '사자자리': '♌', '처녀자리': '♍', '천칭자리': '♎', '전갈자리': '♏',
            '사수자리': '♐', '염소자리': '♑', '물병자리': '♒', '물고기자리': '♓'
        };
        const zodiacData = this.lastAnalysisResult ? this.calculateBaseData(formData) : null;
        const zodiacSym = zodiacData ? (zodiacSymbols[zodiacData.zodiacSign] || '✦') : '✦';

        ctx.font = '28px serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(zodiacSym, cx, cy + 10);

        // Top text - title
        ctx.font = '600 13px Outfit, sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('✦ COSMIC TALISMAN ✦', cx, 42);

        // Name
        ctx.font = '500 15px Pretendard, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${formData.name}님의 부적`, cx, 68);

        // Score badge
        ctx.font = '700 11px Outfit, sans-serif';
        ctx.fillStyle = baseColor;
        ctx.fillText(`TODAY ${result.totalScore}점`, cx, 88);

        // Bottom details
        const bottomY = H - 120;
        ctx.font = '400 11px Pretendard, sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText(`행운수 ${result.luckyNum}  ·  ${result.luckyColor}  ·  ${result.luckyDir}`, cx, bottomY);

        // Lotto numbers
        if (result.lottoNumbers) {
            ctx.font = '600 12px Outfit, sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('LUCKY NUMBERS', cx, bottomY + 25);
            ctx.font = '700 16px Outfit, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(result.lottoNumbers.join(' · '), cx, bottomY + 48);
        }

        // Date
        ctx.font = '300 9px Outfit, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(new Date().toLocaleDateString('ko-KR'), cx, H - 22);

        // Corner decorations
        const cornerSize = 20;
        const corners = [[m + 8, m + 8], [W - m - 8, m + 8], [m + 8, H - m - 8], [W - m - 8, H - m - 8]];
        corners.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd700';
            ctx.fill();
        });

        // Sparkle dots scattered
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * W;
            const y = Math.random() * H;
            const size = Math.random() * 1.5 + 0.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3 + 0.1})`;
            ctx.fill();
        }
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    saveTalisman() {
        const canvas = document.getElementById('talisman-canvas');
        const link = document.createElement('a');
        link.download = `talisman_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // ==================== SNS SHARE CARD ====================
    drawShareCard(formData, result) {
        const canvas = document.getElementById('share-canvas');
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(0.5, '#302b63');
        grad.addColorStop(1, '#24243e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Decorative circles
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 100 + 50, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(138, 43, 226, ${Math.random() * 0.08 + 0.02})`;
            ctx.fill();
        }

        // Header
        ctx.font = '700 24px Outfit, sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('✦ AI FORTUNE ✦', W / 2, 60);

        ctx.font = '300 14px Outfit, sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText('PREMIUM COSMIC ANALYSIS', W / 2, 85);

        // Divider
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W * 0.2, 105);
        ctx.lineTo(W * 0.8, 105);
        ctx.stroke();

        // Name
        ctx.font = '600 22px Pretendard, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${formData.name}님의 오늘의 운세`, W / 2, 145);

        ctx.font = '300 13px Pretendard, sans-serif';
        ctx.fillStyle = '#999';
        ctx.fillText(new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }), W / 2, 170);

        // Score circle
        const scoreY = 240;
        ctx.beginPath();
        ctx.arc(W / 2, scoreY, 50, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(138, 43, 226, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#8a2be2';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = '700 36px Outfit, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(result.totalScore, W / 2, scoreY + 13);
        ctx.font = '300 10px Outfit, sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText('DAILY SCORE', W / 2, scoreY + 30);

        // Summary
        ctx.font = '400 15px Pretendard, sans-serif';
        ctx.fillStyle = '#e0e0e0';
        this.wrapText(ctx, `"${result.summary}"`, W / 2, 325, W - 80, 22);

        // Fortune cards
        const cardY = 400;
        const categories = [
            { label: '💕 애정운', text: result.love },
            { label: '💰 금전운', text: result.money },
            { label: '💼 직업운', text: result.work },
            { label: '🏥 건강운', text: result.health }
        ];

        categories.forEach((cat, i) => {
            const y = cardY + i * 75;
            // Card background
            this.roundRect(ctx, 30, y, W - 60, 65, 12);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = '600 13px Pretendard, sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.textAlign = 'left';
            ctx.fillText(cat.label, 50, y + 22);

            ctx.font = '400 11px Pretendard, sans-serif';
            ctx.fillStyle = '#ccc';
            const shortText = cat.text.length > 40 ? cat.text.substring(0, 40) + '...' : cat.text;
            ctx.fillText(shortText, 50, y + 45);
        });

        ctx.textAlign = 'center';

        // Lucky items
        const luckyY = cardY + 320;
        ctx.font = '500 12px Pretendard, sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`행운수 ${result.luckyNum}  ·  ${result.luckyColor}  ·  ${result.luckyDir}`, W / 2, luckyY);

        // Lotto
        if (result.lottoNumbers) {
            ctx.font = '600 11px Outfit, sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.fillText('LUCKY LOTTO NUMBERS', W / 2, luckyY + 30);

            const ballR = 20;
            const totalWidth = result.lottoNumbers.length * (ballR * 2 + 10) - 10;
            const startX = (W - totalWidth) / 2 + ballR;

            result.lottoNumbers.forEach((num, i) => {
                const x = startX + i * (ballR * 2 + 10);
                const y = luckyY + 62;
                ctx.beginPath();
                ctx.arc(x, y, ballR, 0, Math.PI * 2);
                const ballGrad = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, ballR);
                ballGrad.addColorStop(0, '#c44dff');
                ballGrad.addColorStop(1, '#6a1b9a');
                ctx.fillStyle = ballGrad;
                ctx.fill();
                ctx.font = '700 14px Outfit, sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText(num, x, y + 5);
            });
        }

        // Footer watermark
        ctx.font = '300 10px Outfit, sans-serif';
        ctx.fillStyle = '#555';
        ctx.fillText('AI FORTUNE · oddeye2796-cyber.github.io/ai-fortune', W / 2, H - 25);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        let yPos = y;
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.length > 0) {
                ctx.fillText(line, x, yPos);
                line = words[i];
                yPos += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, yPos);
    }

    downloadShareCard() {
        const canvas = document.getElementById('share-canvas');
        const link = document.createElement('a');
        link.download = `fortune_card_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    async copyShareCard() {
        try {
            const canvas = document.getElementById('share-canvas');
            canvas.toBlob(async (blob) => {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                alert('✅ 이미지가 클립보드에 복사되었습니다!\n카카오톡이나 인스타그램에 바로 붙여넣기 하세요.');
            }, 'image/png');
        } catch (err) {
            console.error('Clipboard error:', err);
            alert('클립보드 복사가 지원되지 않는 브라우저입니다. 이미지 저장을 이용해 주세요.');
        }
    }
}

// 앱 실행
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FortuneApp();
});
