import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform, Switch } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import Header from './BL04_Header';
import { BRAND_COLOR, NOTE_COLORS, getBrandColor } from './BL02_Constants';
import { MaterialIcons } from '@expo/vector-icons';

const SettingsScreen = ({ setCurrentScreen, goToSearch, settings, saveSettings, notes, folders, onAutoDeleteChange, onBrandColorChange }) => {
  const [previewText, setPreviewText] = useState('Пример текста заметки');
  const fontSizeOptions = [14, 16, 18, 20, 22, 24];
  const [autoDelete, setAutoDelete] = useState(settings.autoDelete !== undefined ? settings.autoDelete : false);
  const brandColor = getBrandColor(settings);

  const formatDateForFilename = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
  };

  const handleFontSizeChange = (size) => saveSettings({ ...settings, fontSize: size });

  const handleAutoDeleteToggle = (value) => {
    setAutoDelete(value);
    saveSettings({ ...settings, autoDelete: value });
    if (onAutoDeleteChange) onAutoDeleteChange(value);
  };

  const handleBrandColorChange = (color) => {
    saveSettings({ ...settings, brandColor: color });
    if (onBrandColorChange) onBrandColorChange(color);
  };

  const handleBackup = async () => {
    try {
      const backup = { notes, folders, settings };
      const backupStr = JSON.stringify(backup, null, 2);
      const fileName = `Backup_${formatDateForFilename()}.bak`;

      if (Platform.OS === 'web') {
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(backupStr);
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('✅ Успех', 'Резервная копия создана');
        return;
      }

      // Используем cacheDirectory - всегда доступна для записи
      if (!FileSystem.cacheDirectory) {
        Alert.alert('❌ Ошибка', 'Не удалось получить доступ к файловой системе');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + fileName;
      
      // Записываем файл
      await FileSystem.writeAsStringAsync(fileUri, backupStr);
      
      // Проверяем, что файл создан
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('Файл не создан');
      }

      // Проверяем доступность Sharing
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Открываем системный диалог "Поделиться"
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: '💾 Сохранить резервную копию',
          UTI: 'public.json'
        });
      } else {
        // Если Sharing недоступен, показываем путь к файлу
        Alert.alert(
          '✅ Файл создан',
          `Файл сохранен во временной папке:\n${fileUri}\n\nВы можете найти его через файловый менеджер.`
        );
      }
    } catch (e) {
      console.log('Backup error:', e);
      
      // Запасной вариант - копирование в буфер обмена
      try {
        const backupStr = JSON.stringify({ notes, folders, settings }, null, 2);
        await Clipboard.setStringAsync(backupStr);
        Alert.alert(
          '📋 Данные скопированы',
          'Не удалось создать файл. Данные скопированы в буфер обмена. Вставьте их в любой текстовый редактор и сохраните как .bak файл.'
        );
      } catch (clipboardError) {
        Alert.alert('❌ Ошибка', 'Не удалось создать резервную копию');
      }
    }
  };

  const handleRestore = async () => {
    try {
      // Пробуем сначала восстановить из буфера обмена
      const clipboardContent = await Clipboard.getStringAsync();
      if (clipboardContent) {
        try {
          const parsed = JSON.parse(clipboardContent);
          if (parsed.notes && parsed.folders && parsed.settings) {
            Alert.alert(
              '📋 Найдены данные в буфере',
              'Восстановить данные из буфера обмена?',
              [
                { text: 'Выбрать файл', style: 'cancel' },
                { 
                  text: 'Из буфера', 
                  onPress: async () => {
                    const normalizedNotes = parsed.notes.map(n => ({ ...n, color: n.color || BRAND_COLOR }));
                    await AsyncStorage.setItem('notes', JSON.stringify(normalizedNotes));
                    await AsyncStorage.setItem('folders', JSON.stringify(parsed.folders));
                    await AsyncStorage.setItem('settings', JSON.stringify(parsed.settings));
                    Alert.alert('✅ Успех', 'Данные восстановлены из буфера обмена');
                  }
                }
              ]
            );
            return;
          }
        } catch (e) {
          // Невалидный JSON в буфере - игнорируем
        }
      }

      // Если в буфере нет данных, открываем файловый менеджер
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true
      });
      
      if (result.canceled) return;
      
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const backup = JSON.parse(content);
      
      if (backup.notes && backup.folders && backup.settings) {
        const normalizedNotes = backup.notes.map(n => ({ ...n, color: n.color || BRAND_COLOR }));
        await AsyncStorage.setItem('notes', JSON.stringify(normalizedNotes));
        await AsyncStorage.setItem('folders', JSON.stringify(backup.folders));
        await AsyncStorage.setItem('settings', JSON.stringify(backup.settings));
        
        Alert.alert('✅ Успех', 'Данные восстановлены. Перезапустите приложение.');
      } else {
        Alert.alert('❌ Ошибка', 'Неверный формат файла');
      }
    } catch (e) {
      Alert.alert('❌ Ошибка', 'Не удалось восстановить данные');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header 
        title="Настройки" 
        showBack 
        onBack={() => setCurrentScreen('notes')} 
        rightIcon="close" 
        onRightPress={() => setCurrentScreen('notes')} 
        showSearch 
        onSearchPress={goToSearch} 
        showPalette={false} 
        brandColor={brandColor}
      />
      
      <ScrollView 
        style={{ flex: 1, padding: 20 }} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Размер текста */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16, letterSpacing: 0.5 }}>
            Размер текста
          </Text>
          <View style={{ 
            backgroundColor: '#F8F9FA', 
            borderRadius: 16, 
            padding: 20, 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.05, 
            shadowRadius: 8, 
            elevation: 2 
          }}>
            <View style={{ 
              backgroundColor: 'white', 
              borderRadius: 12, 
              padding: 16, 
              marginBottom: 24, 
              borderWidth: 1, 
              borderColor: '#E0E0E0' 
            }}>
              <Text style={{ fontSize: settings.fontSize, color: '#333', lineHeight: settings.fontSize * 1.5 }}>
                {previewText}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8 }}>
              {fontSizeOptions.map((size) => (
                <TouchableOpacity 
                  key={size} 
                  onPress={() => handleFontSizeChange(size)} 
                  style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 22, 
                    backgroundColor: settings.fontSize === size ? brandColor : '#F0F0F0', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginBottom: 8, 
                    shadowColor: settings.fontSize === size ? brandColor : '#000', 
                    shadowOffset: { width: 0, height: 2 }, 
                    shadowOpacity: settings.fontSize === size ? 0.3 : 0.1, 
                    shadowRadius: 4, 
                    elevation: settings.fontSize === size ? 4 : 1 
                  }}
                >
                  <Text style={{ 
                    color: settings.fontSize === size ? 'white' : '#666', 
                    fontSize: 14, 
                    fontWeight: settings.fontSize === size ? 'bold' : 'normal' 
                  }}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Цвет бренда */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16, letterSpacing: 0.5 }}>
            Цвет бренда
          </Text>
          <View style={{ 
            backgroundColor: '#F8F9FA', 
            borderRadius: 16, 
            padding: 20, 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.05, 
            shadowRadius: 8, 
            elevation: 2 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ 
                width: 50, 
                height: 50, 
                borderRadius: 25, 
                backgroundColor: brandColor, 
                marginRight: 16, 
                shadowColor: brandColor, 
                shadowOffset: { width: 0, height: 2 }, 
                shadowOpacity: 0.3, 
                shadowRadius: 4, 
                elevation: 3 
              }} />
              <Text style={{ fontSize: 16, color: '#666', flex: 1 }}>
                Выберите основной цвет приложения
              </Text>
            </View>
            
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>Доступные цвета:</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {NOTE_COLORS.map((color, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleBrandColorChange(color)} 
                  style={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 25, 
                    backgroundColor: color, 
                    margin: 4, 
                    borderWidth: brandColor === color ? 3 : 0, 
                    borderColor: '#333', 
                    shadowColor: color, 
                    shadowOffset: { width: 0, height: 2 }, 
                    shadowOpacity: brandColor === color ? 0.5 : 0.2, 
                    shadowRadius: 4, 
                    elevation: brandColor === color ? 5 : 2 
                  }} 
                />
              ))}
            </View>
          </View>
        </View>

        {/* Корзина */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16, letterSpacing: 0.5 }}>
            Корзина
          </Text>
          <View style={{ 
            backgroundColor: '#F8F9FA', 
            borderRadius: 16, 
            padding: 20, 
            shadowColor: '#000', 
            shadowOffset: { width: 0, height: 2 }, 
            shadowOpacity: 0.05, 
            shadowRadius: 8, 
            elevation: 2 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 4 }}>
                  Автоудаление через 30 дней
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  Заметки в корзине, которые не изменялись более 30 дней, будут безвозвратно удалены
                </Text>
              </View>
              <Switch 
                value={autoDelete} 
                onValueChange={handleAutoDeleteToggle} 
                trackColor={{ false: '#E0E0E0', true: brandColor }} 
                thumbColor="white" 
                ios_backgroundColor="#E0E0E0" 
                style={{ marginLeft: 16 }}
              />
            </View>
            
            {autoDelete && (
              <View style={{ 
                marginTop: 16, 
                padding: 12, 
                backgroundColor: '#FFF3E0', 
                borderRadius: 8, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}>
                <MaterialIcons name="info" size={20} color="#FF9800" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: '#666', flex: 1 }}>
                  Заметки будут автоматически удаляться через 30 дней после помещения в корзину
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Резервное копирование */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 16, letterSpacing: 0.5 }}>
            Резервное копирование
          </Text>
          <View style={{ backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20, gap: 12 }}>
            <TouchableOpacity 
              style={{ 
                backgroundColor: brandColor, 
                padding: 16, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                shadowColor: brandColor, 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.3, 
                shadowRadius: 8, 
                elevation: 5 
              }} 
              onPress={handleBackup}
            >
              <MaterialIcons name="backup" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Создать резервную копию</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#FF6B6B', 
                padding: 16, 
                borderRadius: 12, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                shadowColor: '#FF6B6B', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 0.3, 
                shadowRadius: 8, 
                elevation: 5 
              }} 
              onPress={() => {
                Alert.alert(
                  'Восстановление', 
                  'Все данные будут заменены. Продолжить?', 
                  [
                    { text: 'Отмена', style: 'cancel' }, 
                    { text: 'Восстановить', onPress: handleRestore }
                  ]
                );
              }}
            >
              <MaterialIcons name="restore" size={24} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Восстановить из копии</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Email */}
        <View style={{ 
          backgroundColor: '#F8F9FA', 
          borderRadius: 16, 
          padding: 20, 
          marginBottom: 20, 
          alignItems: 'center' 
        }}>
          <MaterialIcons name="person" size={40} color={brandColor} style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 16, color: '#333', fontWeight: '500' }}>mihailksk@yandex.ru</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;