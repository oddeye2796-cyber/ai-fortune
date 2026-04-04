/**
 * AI Fortune App Main Scripts
 */

const API_KEY = "AIzaSyAjWn2EYuE6aDXLnqQarEeqE13zShHkcE8";
const MODEL_NAME = "gemini-2.5-flash";

class FortuneApp {
    constructor() {
        this.form = document.getElementById('fortune-form');
        this.inputSection = document.getElementById('input-section');
        this.loadingSection = document.getElementById('loading-section');
        this.resultSection = document.getElementById('result-section');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.retryBtn = document.getElementById('retry-btn');

        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startAnalysis();
        });

        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        this.retryBtn.addEventListener('click', () => {
            this.showSection('input');
        });
    }

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
            this.renderResult(formData.name, analysisData, result);
            this.showSection('result');
        } catch (error) {
            console.error("🔴 Analysis Failed Details:", error);
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
            "aiAdvice": "동서양을 복합적으로 분석한 깊이 있는 조언 (3-4문장)",
            "orientalDetail": "동양 철학(사주, 오행 등) 관점의 분석 내용",
            "westernDetail": "서양 점성술/타로 관점의 분석 내용",
            "luckyNum": "숫자 1개",
            "luckyColor": "색상 이름",
            "luckyDir": "동/서/남/북 등 방향"
        }
        한국어로 답변하세요.
        `;
    }

    async callGemini(prompt) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
        
        console.log("Calling API:", url);
        
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
        
        // JSON 추출 (마크다운 백틱 제거 및 유연한 파싱)
        try {
            // 정규식을 사용하여 { ... } 부분을 찾아 추출
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error("No JSON found in response:", text);
                throw new Error("응답에서 데이터를 찾을 수 없습니다.");
            }
            
            const jsonText = jsonMatch[0].trim();
            console.log("Extracted JSON:", jsonText);
            return JSON.parse(jsonText);
        } catch (e) {
            console.error("JSON Parsing/Extraction Error:", e, "Raw Text:", text);
            throw new Error("분석 데이터를 처리하는 중 오류가 발생했습니다.");
        }
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
        
        // 동양 분석 탭
        document.getElementById('saju-data').innerText = analysisData.ganji;
        document.getElementById('zodiac-data').innerText = analysisData.orientalZodiac;
        document.getElementById('oriental-content').innerText = result.orientalDetail;
        
        // 서양 분석 탭
        document.getElementById('star-data').innerText = analysisData.zodiacSign;
        document.getElementById('num-data').innerText = analysisData.lifePath;
        document.getElementById('western-content').innerText = result.westernDetail;
        
        // 행운 아이템
        document.getElementById('lucky-num').innerText = result.luckyNum;
        document.getElementById('lucky-color').innerText = result.luckyColor;
        document.getElementById('lucky-dir').innerText = result.luckyDir;

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
}

// 앱 실행
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FortuneApp();
});
