import './BL01_Imports';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Linking } from 'react-native';
import AppContent from './BL11_AppContent';

export default function App() {
  useEffect(() => {
    // Обработка открытия из виджета
    const handleDeepLink = (event) => {
      try {
        const url = event.url;
        const noteId = url.split('=')[1]; // Получаем ID заметки из URL
        if (noteId) {
          // Используем глобальное событие для передачи ID заметки в AppContent
          const event = new CustomEvent('openNoteFromWidget', { detail: { noteId } });
          window.dispatchEvent(event);
        }
      } catch (error) {
        console.log('Error handling deep link:', error);
      }
    };

    // Подписываемся на события открытия (для Android)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Проверяем, не открыто ли приложение уже с параметрами
    Linking.getInitialURL().then((url) => {
      if (url) {
        try {
          const noteId = url.split('=')[1];
          if (noteId) {
            // Используем setTimeout чтобы дать время AppContent загрузиться
            setTimeout(() => {
              const event = new CustomEvent('openNoteFromWidget', { detail: { noteId } });
              window.dispatchEvent(event);
            }, 500);
          }
        } catch (error) {
          console.log('Error handling initial URL:', error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}