# Otter English – Secure Final (fix1)

## 왜 버튼이 안 눌릴 수 있나?
- **자바스크립트 로딩 에러**: 이제 상단 "상태" 카드에 에러가 표시됩니다.
- **GitHub Pages에 배포**: `/api/ai` 경로가 없어서 호출 실패 → 버튼은 눌리지만 결과는 실패로 표시됩니다.
  - 해결: **Vercel**에 배포하고 `OPENAI_API_KEY` 환경변수를 설정하세요.

## 배포 요약
1. GitHub에 업로드, Vercel New Project
2. 환경변수 `OPENAI_API_KEY` 추가
3. Deploy → 버튼 연결 완료 메시지 확인

## 파일
- index.html / style.css / player.js
- api/ai.js (서버리스 함수)
- vercel.json
