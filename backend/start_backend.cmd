@echo off
setlocal
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
set SUPERADMIN_KEY=admin123
cd /d "c:\Users\Teju Kurtakoti\Desktop\Skin-cancer\backend"
rem Ensure backend folder is on PYTHONPATH so uvicorn can import the `app` package
set PYTHONPATH=%CD%
"c:\Users\Teju Kurtakoti\Desktop\Skin-cancer\backend\venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir "%CD%" --reload-dir "%CD%\app" --reload --host 0.0.0.0 --port 8000
endlocal
