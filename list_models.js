const https = require('https');

const API_KEY = "AIzaSyBTKDtIvroEL3d5kMWdvBvVYN-1YFb9QKM";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

https.get(url, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log(`✅ 상태 코드: ${res.statusCode}`);
    try {
      const data = JSON.parse(body);
      if (data.models) {
        console.log("📝 사용 가능한 모델 목록:");
        data.models.forEach(m => console.log(`- ${m.name}`));
      } else {
        console.log("❌ 모델 목록을 찾을 수 없습니다.");
        console.log(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log(body);
    }
  });
}).on('error', (e) => {
  console.error("❌ 오류:", e.message);
});
