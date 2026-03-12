@echo off
echo Installing dependencies...
call npm install
call npm install @react-native-async-storage/async-storage
call npm install expo-document-picker
call npm install react-native-vector-icons
call npm install react-native-safe-area-context
call npm install expo-screen-orientation
call npm install expo-file-system
call npm install expo-sharing
call npm install @bittingz/expo-widgets
echo.
echo Installation complete!
pause
