# archiv*o — Claude Code 업무 매뉴얼

## 제품 개요

**archiv*o**는 일상 속 영감을 빠르게 포착하고, 쌓인 영감들이 아이디어로 연결되는 경험을 만드는 도구다.
핵심 플로우: **관찰 → 영감 발견 → 영감 결합**

> 기존 "Linkbook" 코드베이스를 archiv*o로 전면 개편 중. 기존 코드는 레퍼런스 없이 교체 대상으로 취급한다.

---

## 협업 원칙

- **기획은 사용자, 실행은 Claude Code**
- 사용자가 What + Why + 간단한 How를 던지면 → Claude Code가 구체적인 How를 설계·구현한다
- 모르는 것은 추측하지 않고 질문한다
- 코드 변경 전 반드시 해당 파일을 읽는다

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 17 + TypeScript |
| Backend/DB | Supabase (PostgreSQL) |
| AI | Anthropic Claude API (미션 생성, 추후 영감 연결) |
| 배포 | Vercel |

---

## 프로젝트 구조

```
src/
  components/     UI 컴포넌트
  hooks/          데이터 훅 (Supabase 연동)
  lib/            외부 라이브러리 설정 (supabase.ts 등)
  types/          TypeScript 타입 정의
  utils/          유틸 함수
api/              Vercel Serverless Functions
```

---

## 데이터 모델 (목표)

### Inspiration (영감)
```typescript
{
  id: string
  type: 'photo' | 'text' | 'link'
  content: string          // 텍스트 내용 또는 링크 URL
  imageUrl?: string        // 사진 또는 링크 OG 이미지
  memo: string             // "나의 한 마디" — 저장 시 맥락
  tags: string[]           // 무드/카테고리 태그
  missionId?: string       // 미션 완료로 생성된 경우 연결
  createdAt: string
  userId: string
}
```

### Mission (오늘의 미션)
```typescript
{
  id: string
  content: string          // 미션 텍스트
  date: string             // YYYY-MM-DD
  completedAt?: string
  createdAt: string
}
```

---

## 디자인 시스템

**레퍼런스**: `archivo_design_tokens.md` 반드시 참고

### 핵심 컬러
- Primary Blue: `#3B3EED`
- 페이지 배경: `#F5F5F7`
- 카드 배경: `#FFFFFF` + 연블루 그림자
- 홈 그라디언트: `linear-gradient(180deg, #FFFFFF 0%, #DDE1FF 60%, #C7D2FE 100%)`

### 폰트
- Pretendard (한글), SF Pro Display (영문 fallback)

### 절대 금지
- 순수 흰 배경(`#FFFFFF`)만 단독 사용 금지
- 검정 그림자 (`rgba(0,0,0,...)`) 사용 금지
- Primary Blue 남용 금지 (강조에만)

---

## MVP 기능 우선순위

### 🔴 Must Have
1. **빠른 저장** — 사진/텍스트/링크를 3초 안에, "나의 한 마디" 메모 첨부
2. **오늘의 미션** — AI가 매일 관찰 미션 생성
3. **영감 아카이브** — 카드 형태, 시간순/태그별 탐색
4. **온보딩** — 3단계 이내, 첫 미션 안내

### 🟡 Should Have
5. **태그/분류** — 저장 시 무드/카테고리 태그
6. **링크 저장** — OG 이미지/제목 자동 추출 (요약 기능 제외)

### 🟢 V2
7. **영감 연결** — AI가 저장된 영감들의 연결고리 제안

---

## 구현 시 주의사항

- 링크 저장 시 **요약 기능 절대 추가 금지** (PRD 명시: 영감의 핵심은 느낌이지 내용 요약이 아님)
- 저장 플로우의 마찰 최소화가 최우선 UX 원칙
- 모바일 퍼스트 디자인 (타겟: 22~28세 주니어 디자이너/기획자)
