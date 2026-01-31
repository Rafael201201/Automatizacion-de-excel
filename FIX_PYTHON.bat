@echo off
echo ========================================
echo FIX: Reinstalar entorno virtual Python
echo ========================================
echo.

REM 1. Eliminar venv corrupto si existe
if exist "venv" (
    echo [1/4] Eliminando venv antiguo...
    rmdir /s /q venv
    echo      OK - Venv eliminado
) else (
    echo [1/4] No hay venv previo
)

echo.

REM 2. Crear nuevo entorno virtual
echo [2/4] Creando nuevo entorno virtual...
python -m venv venv
if errorlevel 1 (
    echo      ERROR - No se pudo crear venv
    echo.
    echo Posibles causas:
    echo - Python no esta en PATH
    echo - Python no tiene permisos
    echo.
    pause
    exit /b 1
)
echo      OK - Venv creado

echo.

REM 3. Activar y actualizar pip
echo [3/4] Actualizando pip...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
if errorlevel 1 (
    echo      WARNING - No se pudo actualizar pip
) else (
    echo      OK - Pip actualizado
)

echo.

REM 4. Instalar dependencias
echo [4/4] Instalando dependencias...
pip install Flask==3.0.0
pip install Flask-CORS==4.0.0
pip install pandas==2.1.4
pip install openpyxl==3.1.2
pip install python-docx==1.1.0
pip install Werkzeug==3.0.1

if errorlevel 1 (
    echo      ERROR - Fallo instalando dependencias
    pause
    exit /b 1
)

echo      OK - Dependencias instaladas

echo.
echo ========================================
echo INSTALACION COMPLETADA
echo ========================================
echo.
echo Ahora puedes ejecutar:
echo    python processor_enhanced.py
echo.
echo O iniciar todo con:
echo    npm run dev:all
echo.
pause
