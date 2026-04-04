/**
 * Fortune Engine - Utility functions for Eastern and Western fortune calculations
 */

const FortuneEngine = {
    // 캔버스 배경 애니메이션 초기화
    initCanvas: function() {
        const canvas = document.getElementById('stars-canvas');
        const ctx = canvas.getContext('2d');
        let width, height, stars = [];

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initStars();
        }

        function initStars() {
            stars = [];
            const count = Math.floor((width * height) / 3000);
            for (let i = 0; i < count; i++) {
                stars.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 2,
                    speed: Math.random() * 0.5,
                    opacity: Math.random()
                });
            }
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#ffffff';
            stars.forEach(star => {
                ctx.globalAlpha = star.opacity;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                star.y -= star.speed;
                if (star.y < 0) star.y = height;
                
                // 불빛 반짝임 효과
                star.opacity += (Math.random() - 0.5) * 0.05;
                if (star.opacity < 0.1) star.opacity = 0.1;
                if (star.opacity > 0.8) star.opacity = 0.8;
            });
            requestAnimationFrame(draw);
        }

        window.addEventListener('resize', resize);
        resize();
        draw();
    },

    // 서양 별자리 판별
    getZodiacSign: function(dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "물병자리 (Aquarius)";
        if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "물고기자리 (Pisces)";
        if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "양자리 (Aries)";
        if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "황소자리 (Taurus)";
        if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) return "쌍둥이자리 (Gemini)";
        if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) return "게자리 (Cancer)";
        if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "사자자리 (Leo)";
        if ((month == 8 && day >= 23) || (month == 9 && day <= 23)) return "처녀자리 (Virgo)";
        if ((month == 9 && day >= 24) || (month == 10 && day <= 22)) return "천칭자리 (Libra)";
        if ((month == 10 && day >= 23) || (month == 11 && day <= 22)) return "전갈자리 (Scorpio)";
        if ((month == 11 && day >= 23) || (month == 12 && day <= 24)) return "사수자리 (Sagittarius)";
        return "염소자리 (Capricorn)";
    },

    // 수비학 (Life Path Number) 계산
    getLifePathNumber: function(dateStr) {
        const numbers = dateStr.replace(/-/g, '').split('').map(Number);
        let sum = numbers.reduce((a, b) => a + b, 0);
        
        while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
            sum = sum.toString().split('').map(Number).reduce((a, b) => a + b, 0);
        }
        return sum;
    },

    // 12간지 (띠) 계산
    getOrientalZodiac: function(year) {
        const zodiacs = ["원숭이 (申)", "닭 (酉)", "개 (戌)", "돼지 (亥)", "쥐 (子)", "소 (丑)", "호랑이 (寅)", "토끼 (卯)", "용 (辰)", "뱀 (巳)", "말 (午)", "양 (未)"];
        return zodiacs[year % 12];
    },

    // 타로 카드 랜덤 선택
    getRandomTarot: function() {
        const majorArcana = [
            "The Fool (광대)", "The Magician (마법사)", "The High Priestess (고위 여사제)", 
            "The Empress (여황제)", "The Emperor (황제)", "The Hierophant (교황)", 
            "The Lovers (연인)", "The Chariot (전차)", "Justice (정의)", 
            "The Hermit (은둔자)", "Wheel of Fortune (운명의 수레바퀴)", "Strength (힘)", 
            "The Hanged Man (매달린 사람)", "Death (죽음)", "Temperance (절제)", 
            "The Devil (악마)", "The Tower (탑)", "The Star (별)", 
            "The Moon (달)", "The Sun (태양)", "Judgement (심판)", "The World (세계)"
        ];
        return majorArcana[Math.floor(Math.random() * majorArcana.length)];
    },

    // 사주 천간지지 (간략형 - 연도 기반)
    getYearlyGanji: function(year) {
        const stems = ["경 (庚)", "신 (辛)", "임 (壬)", "계 (癸)", "갑 (甲)", "을 (乙)", "병 (丙)", "정 (丁)", "무 (戊)", "기 (己)"];
        const branches = ["신 (申)", "유 (酉)", "술 (戌)", "해 (亥)", "자 (子)", "축 (丑)", "인 (寅)", "묘 (卯)", "진 (辰)", "사 (巳)", "오 (午)", "미 (未)"];
        
        const stemIdx = year % 10;
        const branchIdx = year % 12;
        
        return stems[stemIdx] + branches[branchIdx] + "년생";
    }
};

// 페이지 로드 시 캔버스 실행
document.addEventListener('DOMContentLoaded', () => {
    FortuneEngine.initCanvas();
});
