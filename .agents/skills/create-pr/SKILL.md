---
name: create-pr
description: Use when the user asks to create a pull request, push and create PR, or finish a branch with a PR. Enforces the team's PR template format with ticket number, summary, key changes, changed files, and test status.
---

# Create PR

## PR Template

### Title Format
```
[TICKET-NUMBER] [FE] - 구현 내용 요약
```
- 요약은 한국어, 70자 이내

### Body Format
```markdown
## 1. 구현 내용 요약
- 이 PR에서 무엇을 했는지 1-3줄 요약

## 2. 핵심 변경 내용
- 주요 변경 사항을 bullet point로 나열
- 각 항목은 구체적으로 (파일명 또는 기능 단위)

## 3. 변경 파일
- `path/to/file.tsx` — 변경 설명
- `path/to/file.ts` — 변경 설명

## 4. 테스트 여부
- [ ] 단위 테스트 작성/수정
```

### Labels
변경 내용의 성격에 따라 적절한 라벨을 자동 선택:

| 라벨 | 기준 |
|------|------|
| `feature` | 새로운 기능 추가 |
| `bug` | 버그 수정 |
| `refactoring` | 리팩토링 (기능 변경 없는 구조 개선) |
| `test` | 테스트 추가/수정 |
| `documentation` | 문서 변경 |
| `ci/cd` | CI/CD 파이프라인 변경 |
| `dx` | 개발자 경험 개선 (린트, 툴링 등) |

- 복수 라벨 가능 (e.g., `feature` + `test`)
- 커밋 메시지와 변경 파일 기반으로 판단

### Assignees
- 항상 `--assignee @me` 사용

## Process

1. `git log main...HEAD`와 `git diff main...HEAD`로 전체 변경 내용 파악
2. 브랜치명에서 티켓 번호 추출
3. 위 템플릿에 맞춰 title과 body 작성
4. **사용자에게 title과 body를 보여주고 컨펌 받기** (절대 바로 생성하지 않음)
5. 컨펌 후 `gh pr create` 실행

```bash
gh pr create \
  --title "[TICKET-NUMBER] [FE] - 요약" \
  --body "$(cat <<'EOF'
... body content ...
EOF
)" \
  --assignee @me \
  --label "feature"
```

## Important
- PR base 브랜치는 사용자에게 확인 (기본: main)
- push가 안 되어 있으면 먼저 push 여부 확인
- body 내용은 커밋 메시지가 아닌 실제 코드 변경 기반으로 작성
