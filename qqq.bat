@echo off
echo ===== ДИАГНОСТИКА ВИДЖЕТА ===== > diagnostic_log.txt
echo Дата: %date% %time% >> diagnostic_log.txt
echo. >> diagnostic_log.txt

echo ===== 1. СТРУКТУРА ПРОЕКТА ===== >> diagnostic_log.txt
echo. >> diagnostic_log.txt

echo --- Папка widgets/android/src/main/java --- >> diagnostic_log.txt
dir /s /b widgets\android\src\main\java >> diagnostic_log.txt 2>&1
echo. >> diagnostic_log.txt

echo --- Папка widgets/android/src/main/res --- >> diagnostic_log.txt
dir /s /b widgets\android\src\main\res >> diagnostic_log.txt 2>&1
echo. >> diagnostic_log.txt

echo --- Папка android/app/src/main --- >> diagnostic_log.txt
dir /s /b android\app\src\main\java\com\mkhailksk >> diagnostic_log.txt 2>&1
dir /s /b android\app\src\main\res\xml >> diagnostic_log.txt 2>&1
dir /s /b android\app\src\main\res\layout >> diagnostic_log.txt 2>&1
echo. >> diagnostic_log.txt

echo ===== 2. СОДЕРЖИМОЕ КЛЮЧЕВЫХ ФАЙЛОВ ===== >> diagnostic_log.txt
echo. >> diagnostic_log.txt

echo --- app.json --- >> diagnostic_log.txt
type app.json >> diagnostic_log.txt 2>&1
echo. >> diagnostic_log.txt

echo --- AndroidManifest.xml (если есть) --- >> diagnostic_log.txt
if exist android\app\src\main\AndroidManifest.xml (
    type android\app\src\main\AndroidManifest.xml >> diagnostic_log.txt 2>&1
) else (
    echo Файл не найден >> diagnostic_log.txt
)
echo. >> diagnostic_log.txt

echo --- NotesWidget.kt (в widgets) --- >> diagnostic_log.txt
if exist widgets\android\src\main\java\com\mkhailksk\snack5055ac3e1432423490bec9b4cbbab3f9\widget\NotesWidget.kt (
    type widgets\android\src\main\java\com\mkhailksk\snack5055ac3e1432423490bec9b4cbbab3f9\widget\NotesWidget.kt >> diagnostic_log.txt 2>&1
) else (
    echo Файл не найден >> diagnostic_log.txt
)
echo. >> diagnostic_log.txt

echo --- NotesWidget.kt (в android) --- >> diagnostic_log.txt
if exist android\app\src\main\java\com\mkhailksk\snack5055ac3e1432423490bec9b4cbbab3f9\widget\NotesWidget.kt (
    type android\app\src\main\java\com\mkhailksk\snack5055ac3e1432423490bec9b4cbbab3f9\widget\NotesWidget.kt >> diagnostic_log.txt 2>&1
) else (
    echo Файл не найден >> diagnostic_log.txt
)
echo. >> diagnostic_log.txt

echo --- widget_notes.xml (layout) --- >> diagnostic_log.txt
if exist widgets\android\src\main\res\layout\widget_notes.xml (
    type widgets\android\src\main\res\layout\widget_notes.xml >> diagnostic_log.txt 2>&1
) else (
    echo Файл не найден >> diagnostic_log.txt
)
echo. >> diagnostic_log.txt

echo --- notes_widget_info.xml (xml) --- >> diagnostic_log.txt
if exist widgets\android\src\main\res\xml\notes_widget_info.xml (
    type widgets\android\src\main\res\xml\notes_widget_info.xml >> diagnostic_log.txt 2>&1
) else (
    echo Файл не найден >> diagnostic_log.txt
)
echo. >> diagnostic_log.txt

echo ===== 3. ПРОВЕРКА ADB ===== >> diagnostic_log.txt
echo. >> diagnostic_log.txt
adb devices >> diagnostic_log.txt 2>&1
echo. >> diagnostic_log.txt

echo ===== 4. ПРОВЕРКА ВИДЖЕТА ЧЕРЕЗ ADB ===== >> diagnostic_log.txt
echo. >> diagnostic_log.txt
adb shell dumpsys appwidget | findstr "com.mkhailksk" >> diagnostic_log.txt 2>&1
echo. >> diagnostic_log.txt

echo ===== 5. ЛОГИ УСТАНОВКИ ===== >> diagnostic_log.txt
echo. >> diagnostic_log.txt
adb logcat -d | findstr "PackageManager" >> diagnostic_log.txt 2>&1
echo. >> diagnostic_log.txt

echo ===== ДИАГНОСТИКА ЗАВЕРШЕНА ===== >> diagnostic_log.txt
echo Лог сохранен в diagnostic_log.txt
pause