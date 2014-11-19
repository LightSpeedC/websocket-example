start http://localhost:8080
hotnode websocket-ex
if %errorlevel% neq 0 (node_modules\.bin\hotnode websocket-ex)
if %errorlevel% neq 0 (node websocket-ex)
pause
