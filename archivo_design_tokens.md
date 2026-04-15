# archiv*o Design Tokens
> Claude Code에게 전달하는 디자인 시스템 레퍼런스

---

## Color Palette

### Primary — Archivo Blue
| Token | Hex | 용도 |
|-------|-----|------|
| `--color-primary-100` | `#3B3EED` | 메인 버튼, 강조 텍스트, 아이콘 |
| `--color-primary-80` | `#6366F1` | 호버 상태, 보조 강조 |
| `--color-primary-60` | `#818CF8` | 미션 카드 배경, 태그 |
| `--color-primary-40` | `#A5B4FC` | 서브 아이콘, 비활성 상태 |
| `--color-primary-20` | `#C7D2FE` | 배경 그라디언트 레이어 |
| `--color-primary-10` | `#E0E7FF` | 카드 배경, 서피스 |
| `--color-primary-05` | `#EEF2FF` | 페이지 배경 |

### Neutral — Black
| Token | Hex | 용도 |
|-------|-----|------|
| `--color-black-100` | `#0D0D0D` | 본문 텍스트 |
| `--color-black-80` | `#1F1F1F` | 헤딩 텍스트 |
| `--color-black-60` | `#3D3D3D` | 서브 텍스트 |
| `--color-black-50` | `#6B6B6B` | 플레이스홀더, 비활성 텍스트 |
| `--color-black-30` | `#A3A3A3` | 구분선, 보조 아이콘 |
| `--color-black-20` | `#D4D4D4` | 보더, 디바이더 |
| `--color-white` | `#FFFFFF` | 카드 배경, 버튼 텍스트 |

### Accent — Yellow
| Token | Hex | 용도 |
|-------|-----|------|
| `--color-yellow-100` | `#FFC300` | 강조 포인트, 미션 완료 |
| `--color-yellow-40` | `#FFE082` | 서브 강조 |
| `--color-yellow-10` | `#FFF9E6` | 배경 틴트 |

---

## Background & Surface

```
페이지 배경:    #F5F5F7  (neutral light)
카드 배경:      #FFFFFF  with box-shadow
서피스 배경:    #EEF2FF  (primary-05)
그라디언트 BG:  linear-gradient(180deg, #FFFFFF 0%, #E8EAFF 100%)
```

### 홈 화면 배경 그라디언트 (이미지 1 기준)
```css
background: linear-gradient(180deg, #FFFFFF 0%, #DDE1FF 60%, #C7D2FE 100%);
```

### AI 화면 배경 그라디언트 (이미지 2 기준)
```css
background: linear-gradient(180deg, #F0F2FF 0%, #E8EEFF 50%, #DDEEFF 100%);
```

---

## Typography

```
Font Family: Pretendard (한글), SF Pro Display (영문 fallback)

Heading 1:  Bold  28px  #1F1F1F  line-height 1.3
Heading 2:  Bold  22px  #1F1F1F  line-height 1.4
Heading 3:  Bold  18px  #1F1F1F  line-height 1.4
Body:       Regular 16px  #3D3D3D  line-height 1.6
Caption:    Regular 13px  #6B6B6B  line-height 1.5
Label:      Medium  12px  #A3A3A3  line-height 1.4
```

### 홈 화면 타이틀 스타일 (이미지 1 기준)
```css
/* "오늘의 영감을" */
font-size: 28px;
font-weight: 700;
color: #1F1F1F;

/* "기록해 보세요" */
font-size: 28px;
font-weight: 700;
color: #3B3EED;  /* Primary Blue */
```

---

## Spacing Scale

```
4px   xs
8px   sm
12px  md
16px  lg   ← 기본 패딩
20px  xl
24px  2xl
32px  3xl
40px  4xl
48px  5xl
```

---

## Border Radius

```
4px   chip, 작은 태그
8px   인풋, 작은 카드
12px  카드
16px  바텀시트, 모달
24px  버튼 (pill)
999px 완전 pill (태그, 배지)
```

---

## Shadow

```css
/* 카드 기본 */
box-shadow: 0px 2px 12px rgba(59, 62, 237, 0.08);

/* 카드 hover / 활성 */
box-shadow: 0px 4px 20px rgba(59, 62, 237, 0.16);

/* FAB 버튼 */
box-shadow: 0px 4px 16px rgba(59, 62, 237, 0.32);
```

---

## Key Components

### 미션 배너 (홈 상단)
```
배경: #EEEFFD (primary-10에 가까운 연보라)
아이콘: * (Archivo 심볼, #3B3EED)
텍스트: #1F1F1F, 16px Medium
border-radius: 12px
padding: 14px 16px
```

### 영감 저장 카드 (홈 중앙 큰 카드)
```
배경: #3B3EED (Primary Blue)
border-radius: 24px (상단), 말풍선 꼬리 포함
크기: 화면 너비 - 48px 양쪽 마진
```

### 하단 미니 카드 (영감찾기 / 영감연습)
```
배경: #FFFFFF
border-radius: 16px
태그 배경: #EEF2FF
태그 텍스트: #3B3EED, 11px Medium
```

### FAB 버튼 (하단 고정)
```
크기: 56px x 56px
배경: #3B3EED
아이콘: 홈 아이콘, #FFFFFF
border-radius: 999px
shadow: 0px 4px 16px rgba(59,62,237,0.32)
```

### AI 화면 태그 칩
```
배경: #FFFFFF
border: 1px solid #E0E7FF
border-radius: 999px
padding: 8px 16px
텍스트: #3D3D3D, 14px Regular
```

### 검색 바 (AI 화면 하단)
```
배경: #FFFFFF
border: 1.5px solid #3B3EED
border-radius: 999px
padding: 12px 16px
placeholder: #A3A3A3
```

---

## Motion & Interaction

```
기본 트랜지션:  200ms ease-out
카드 진입:      300ms ease-out (fade + translateY 8px → 0)
FAB 탭:        scale 0.92 → 1.0, 150ms
미션 완료:     confetti + scale 애니메이션
```

---

## Do / Don't

### ✅ Do
- 배경은 항상 연한 블루 그라디언트 기반
- Primary Blue는 강조에만 사용, 남용 금지
- 카드는 항상 흰 배경 + 연한 블루 그림자
- 텍스트 강조는 Primary Blue 컬러로

### ❌ Don't
- 순수 흰 배경(#FFFFFF)만 단독으로 쓰지 않기
- 검정 그림자(rgba 0,0,0) 사용 금지
- 레드/그린 계열 상태 컬러 남용 금지
- 텍스트에 Primary Blue 100% 남용 금지
