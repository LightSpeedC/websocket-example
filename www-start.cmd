start http://localhost:8080
hotnode websocket-test
if %errorlevel% neq 0 (node websocket-test)
pause
