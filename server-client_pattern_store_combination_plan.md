# Next.js 서버-클라이언트 컴포넌트와 Zustand 스토어 연동 전략

이 문서는 Next.js 환경에서 서버 사이드 렌더링(SSR)의 이점을 살리면서, 클라이언트 사이드에서의 효율적인 실시간 상태 관리를 위해 Zustand 스토어를 어떻게 연동할지에 대한 전략을 정리합니다.

## 최종 목표

- **빠른 초기 로딩 속도:** 사용자가 처음 페이지에 접근했을 때, 서버에서 렌더링된 컨텐츠를 즉시 볼 수 있게 한다.
- **효율적인 실시간 업데이트:** 데이터베이스 변경이 발생했을 때, 전체 페이지를 새로고침하지 않고 변경이 필요한 UI 컴포넌트만 최소한으로 리렌더링하여 부드러운 사용자 경험을 제공한다.

## 핵심 아키텍처: 하이브리드 접근 방식

"초기 렌더링은 서버에서 Prop Drilling으로, 이후 클라이언트에서의 모든 동적 업데이트는 Zustand 스토어를 통해" 처리하는 하이브리드 방식을 채택합니다.

### 데이터 흐름도

1.  **최초 페이지 요청 (SSR):**
    -   사용자가 페이지를 요청하면, Next.js 서버의 서버 컴포넌트(예: `page.tsx`, `ContinentMapWrapperServer.tsx`)가 실행됩니다.
    -   서버 컴포넌트는 데이터베이스(Supabase)에 직접 접근하여 필요한 전체 데이터(예: `playerList`)를 조회(`fetch`)합니다.
    -   조회한 전체 데이터를 `props`를 통해 클라이언트 컴포넌트(예: `ContinentMapWrapperClient.tsx`)로 전달합니다. 이 과정에서 **Prop Drilling**이 사용됩니다.
    -   서버는 이 데이터를 기반으로 완전한 HTML을 생성하여 클라이언트에게 전송합니다.

2.  **클라이언트 Hydration:**
    -   클라이언트는 서버로부터 완성된 HTML과 JavaScript 번들을 수신합니다.
    -   React는 수신한 HTML 위에 JavaScript 로직(상태, 이벤트 핸들러 등)을 입히는 **Hydration** 과정을 시작합니다.
    -   이 과정에서 클라이언트 컴포넌트(`ContinentMapWrapperClient.tsx`)는 `props`로 전달받은 초기 데이터를 사용하여 **Zustand 스토어를 최초로 초기화**합니다. (`initializePlayers(initialPlayerList)`)
    -   이로써 클라이언트의 상태 저장소는 서버가 렌더링한 시점의 데이터와 완벽하게 동기화됩니다.

3.  **실시간 업데이트 (Client-Side):**
    -   Hydration이 완료되고 스토어가 초기화되면, 클라이언트는 데이터베이스(Supabase)의 실시간 변경 사항을 구독하는 채널을 엽니다.
    -   이제부터 발생하는 모든 데이터 변경(`INSERT`, `UPDATE`, `DELETE`)은 이 실시간 채널의 `payload`를 통해 클라이언트로 전달됩니다.
    -   Zustand 스토어의 구독 콜백 함수는 이 `payload`를 받아, 전체 데이터를 다시 `fetch`하는 대신 기존 상태 배열(`players`)을 직접 수정하여 상태를 업데이트합니다.
    -   UI의 가장 말단에 있는 컴포넌트(예: `TerritoryArea.tsx`)는 더 이상 `props`로 데이터를 받지 않고, Zustand 스토어에서 자신의 ID에 해당하는 데이터만 직접 구독(`usePlayerStore(selectPlayerById(playerId))`)합니다.
    -   결과적으로, 특정 플레이어의 정보가 변경되면 오직 해당 플레이어의 UI 컴포넌트만 선택적으로 리렌더링됩니다.

## Zustand 스토어 설계 원칙

1.  **상태(State):**
    -   `players: Player[]`: 전체 플레이어 목록을 담는 배열. **유일한 진실 공급원(Single Source of Truth)** 역할을 합니다.
    -   `isInitialized: boolean`: 서버로부터 받은 초기 데이터로 스토어가 초기화되었는지 여부를 추적하는 플래그. 중복 초기화를 방지합니다.
    -   `lastUpdatedPlayers: PlayerUpdateInfo[]` (선택사항): 알림 기능 등, "어떤 변경이 있었는지" 자체에만 관심있는 컴포넌트를 위한 상태.

2.  **액션(Actions):**
    -   `initializePlayers(initialPlayers: Player[])`: 서버에서 받은 초기 데이터로 `players` 상태를 설정하고 `isInitialized`를 `true`로 변경하는 액션.
    -   `subscribeToPlayers()`: Supabase 실시간 구독을 시작하고, `INSERT`, `UPDATE`, `DELETE` 이벤트에 따라 `players` 배열을 직접 수정하는 핸들러를 등록하는 액션.
    -   `unsubscribeFromPlayers()`: 구독을 해제하는 액션.

## `fetch` 함수의 역할 재정의

-   **주요 역할(SSR):** 서버 컴포넌트에서 최초 페이지 렌더링에 필요한 데이터를 가져오는 데 사용됩니다.
-   **보조 역할(Client-Side):** 실시간 연결이 장시간 끊겼다가 재연결되는 등, 데이터 정합성이 깨질 수 있는 예외적인 상황에서 클라이언트의 전체 상태를 DB와 강제로 동기화하기 위한 **비상 수단** 또는 **수동 새로고침** 기능으로 사용될 수 있습니다. 평상시의 데이터 업데이트에는 사용되지 않습니다.

## 기대 효과

-   **성능:** SSR을 통해 초기 로딩 성능을 극대화하고, 이후에는 Zustand와 선택적 구독(selector)을 통해 리렌더링을 최소화하여 애플리케이션 반응성을 높입니다.
-   **코드 품질:** 데이터 흐름이 `서버 -> 스토어 -> UI`로 명확해지고, 컴포넌트의 책임이 분리(Prop Drilling 제거)되어 코드의 복잡도가 낮아지고 유지보수성이 향상됩니다.
-   **사용자 경험:** 페이지 깜빡임이나 전체 리프레시 없이 변경 사항이 부드럽게 UI에 반영됩니다.
