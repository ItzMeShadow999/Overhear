@for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5057 " ^| findstr LISTENING') do taskkill /F /PID %%a
