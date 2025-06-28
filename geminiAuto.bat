rem run-gemini-wt.bat
@echo off
set "DIR=C:\Users\Jaeho\Desktop\Projects\Playground\capital_clash_fe"

rem ── 새 Windows Terminal 창 + 새 탭을 CMD 프로필로 열어서 ──
rem ── 바로 gemini 실행, 끝나도 셸 유지(-NoExit) ──
wt.exe new-tab -p "Command Prompt" -d "%DIR%" ^
       cmd /k "gemini & pause"