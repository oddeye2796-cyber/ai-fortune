const https = require('https');

const API_KEY = "AIzaSyAjWn2EYuE6aDXLnqQarEeqE13zShHkcE8";
const MODEL_NAME = "gemini-2.5-flash";

const data = JSON.stringify({
  contents: [{
    parts: [{
      text: "안녕, 너는 누구니? 한국어로 짧게 대답해줘."
    }]
  }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log(`📡 API 호출 테스트 중... (모델: ${MODEL_NAME})`);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log(`✅ 응답 상태: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(body);
      if (res.statusCode === 200) {
        console.log("📝 응답 내용:", parsed.candidates[0].content.parts[0].text);
      } else {
        console.error("❌ 오류 내용:", JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.log("📝 원본 본문:", body);
    }
  });
});

req.on('error', (e) => {
  console.error("❌ 네트워크 오류:", e.message);
});

req.write(data);
req.end();
