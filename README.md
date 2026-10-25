# 꿈꾸고이써연

잠든 이써연의 침대를 들고 둥실둥실 뛰는 해냥이들 아래로 블럭을 끼워 넣어 탑을 쌓는 세로형(9:16) 타이밍 게임이에요.

## 실행
`index.html`을 로컬 웹 서버로 여세요. (브라우저가 파일을 직접 열면 이미지를 불러오지 못할 수 있어요)
예: 이 폴더에서 `python3 -m http.server` 실행 후 `http://localhost:8000` 접속.

파일 하나로 나눠 주고 싶을 때는 `node tools/build-single-file.mjs` → `dist/kkumkkugo-isseoyeon.html` (이미지를 모두 넣은 단일 HTML, 더블클릭으로 바로 열림).

## 해상도
- 렌더 해상도 **720×1280 고정** (9:16). 기기 화면 밀도와 상관없이 항상 이 해상도로 그린 뒤 화면 크기에 맞춰 표시해요.
- 게임 좌표는 360×640 기준(내부 2배 렌더). 판정·점프·카메라 값은 이 좌표 기준이에요.
- 화면에서는 보이는 영역 안에 들어가는 가장 큰 9:16 크기로 자동으로 맞춰요.

## 배포 (Cloudflare Pages)
- 빌드 명령: 없음 / 출력 디렉터리: `/` (저장소 루트)
- `index.html` + `assets/`만 있으면 동작해요. `worker/`, `tools/`는 페이지에 쓰이지 않아요.

## 조작
| 입력 | 동작 |
|---|---|
| 탭 / 클릭 / Space / Enter | 블럭 쏘기 (시작·게임오버 화면에서는 시작 / 다시 하기) |
| Esc / Space / Enter | 랭킹 창 닫기 |

## 게임 규칙
- 탑은 2단으로 시작. 맨 위에는 해냥이(1~5마리)가 잠든 이써연의 침대를 들고 자동으로 계속 점프해요.
- 조준점(점선)이 좌우로 움직여요. 해냥이가 충분히 떠올라 조준점이 **초록색**일 때 쏘면 그 아래로 블럭이 끼워져요.
- 흰 점선일 때(해냥이가 내려와 있을 때) 쏘면 부딪혀서 게임 오버.
- 아래 블럭에서 벗어난 부분은 잘려 떨어지고, 완전히 빗나가도 게임 오버.
- 5px 이내로 맞추면 PERFECT. 3연속 PERFECT부터 블럭 폭이 조금씩 회복돼요.
- 조준점 속도는 층이 오를수록 빨라지고(최대 6.8), 해냥이 점프 리듬은 항상 같아요.

### 주요 값 (`index.html`)
| 항목 | 값 |
|---|---|
| 게임 좌표 / 렌더 해상도 | 360×640 / 720×1280 고정 (2배) |
| 블럭 높이 / 시작 폭 | 30 / 190 |
| PERFECT 허용 오차 | 5 |
| 해냥이 점프 | 초기 속도 -9.8, 중력 0.265 (꼭대기 근처 0.106), 착지 후 대기 22프레임 |
| 블럭이 들어갈 수 있는 순간 | 해냥이가 블럭 높이의 85% 이상 떠 있을 때 |
| 배경 단계 | 0~29층 달밤 구름마을 / 30~69층 구름왕국 / 70층~ 별빛 정원 (전환 0.8초) |

## 온라인 랭킹
- 서버: `https://kkranking.jinthesurge.workers.dev` (`index.html`의 `RANK_API` 상수)
- `POST /score` `{name, score}` — 게임오버 화면이 뜬 뒤, 이번 점수가 이 기기에서 등록한 최고 점수보다 높을 때만 1회 전송
- `GET /top` — `[{name, score}, ...]` 상위 10개 표시
- 처음 등록할 때 닉네임 입력(최대 10자, 브라우저에 저장). 건너뛰면 이번 기록은 등록 안 함
- 랭킹 보기: 시작 화면·게임오버 화면의 "랭킹 보기". 랭킹 화면에서 닉네임 변경 가능(다음 기록부터 적용)
- 등록 실패 시 게임오버 화면의 안내 문구를 눌러 다시 시도. 응답이 없으면 7초 뒤 실패 처리
- 닉네임 금칙어: Lulucy's Flight와 같은 필터(`tools/nickname_filter.js`). 게임과 서버 양쪽에서 검사하고, 서버에 금칙어 닉네임이 있어도 화면에는 '(가려진 닉네임)'으로 표시
- 브라우저 저장 키: `kkisy-name`(닉네임), `kkisy-rank-sent`(이 기기에서 등록한 최고 점수), `stackBest`(최고 기록)

### 랭킹 서버 배포 (`worker/`, 처음 한 번)
1. `cd worker` → `npx wrangler login`
2. `npx wrangler kv namespace create RANK` → 출력된 `id`를 `wrangler.toml`의 `id = "..."`에 붙여 넣기
3. `npx wrangler deploy`
4. 나온 주소가 `RANK_API`와 다르면 `index.html`의 `RANK_API`를 그 주소로 바꾸기

- 닉네임마다 최고 점수 1개만 보관, 상위 100명까지 저장, 점수는 1~9999 정수만 받음
- 로컬 시험: `cd worker && node local-server.mjs` → `http://localhost:8787` (메모리 저장)
- 랭킹 초기화: Cloudflare 대시보드 → Workers KV → RANK → 키 `top` 삭제

## 폴더 구조
```
index.html                 게임 전체 (HTML·CSS·JS 한 파일)
assets/
  backgrounds/             bg_01~03.jpg (단계별 배경), ground_clouds.png (시작 지면)
  blocks/                  block_01~08.png (색깔별 블럭 띠, 양 끝 + 가운데를 잘라 씀)
  characters/              haenyangi_*.png (120×120, 9프레임), sseoyeon_sleep/wake.png (침대 포함)
  effects/                 fx_perfect_0~7, fx_block_impact_0~5, fx_land_dust_0~5
  ui/                      logo, panel, button_normal/pressed, digit_0~9
worker/                    랭킹 서버 (Cloudflare Worker + KV)
tools/
  build-single-file.mjs    단일 HTML 만들기
  nickname_filter.js       닉네임 금칙어 필터 (게임·서버 공용)
```

### 해냥이 프레임
| 상태 | 파일 |
|---|---|
| 대기 / 점프 직전 | haenyangi_idle / haenyangi_anticipate |
| 도약 순간(처음 약 5프레임, 효과선 포함) | haenyangi_takeoff |
| 상승·꼭대기 / 하강 (효과 없음) | haenyangi_apex / haenyangi_fall |
| 착지 후 | haenyangi_recover |
| 충돌(게임오버, 10fps 1회) | haenyangi_bump_1 → 2 → 3 |

이펙트: PERFECT 8프레임 10fps(점수 아래 화면 위쪽 고정), 블럭 충격·착지 먼지 6프레임 12fps, 모두 1회 재생.

## 남은 이슈 (아트)
- 블럭 원본 시트는 조각마다 테두리가 닫혀 있어서, 이어 붙인 띠로 가공해 씀. 넓은 블럭에서 무늬 이음 흔적이 살짝 보일 수 있음
- 이써연 그림에 침대가 함께 그려져 있어 침대 크기는 고정(탑 폭에 따라 늘어나지 않음)
- 배경 3장은 위아래가 이어지지 않아 화면에 고정해 사용
- 해냥이 apex/fall은 원본 프레임에서 효과만 지운 임시본. 효과 없는 공중 포즈 원화가 오면 두 파일만 교체
