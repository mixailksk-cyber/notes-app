import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { WidgetDataModule } = NativeModules;

// Функция для обновления данных виджета
export const updateWidgetData = async (notes) => {
  try {
    // Берем только заметки из папки "Главная" (не удаленные)
    const mainFolderNotes = notes
      .filter(note => note.folder === 'Главная' && !note.deleted)
      .slice(0, 5) // Ограничиваем до 5 заметок
      .map(note => ({
        id: note.id,
        title: note.title || 'Без названия',
        content: note.content || '...'
      }));
    
    // Обновляем данные в SharedPreferences через нативный модуль
    if (WidgetDataModule) {
      WidgetDataModule.updateWidgetNotes(mainFolderNotes);
    }
    
    // Сохраняем также в AsyncStorage для резерва
    await AsyncStorage.setItem('@widget_notes', JSON.stringify(mainFolderNotes));
  } catch (error) {
    console.error('Error updating widget:', error);
  }
};