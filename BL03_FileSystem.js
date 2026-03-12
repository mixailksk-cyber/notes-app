import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import RNFS from 'react-native-fs';

let FileSystemModule;

if (Platform.OS === 'web') {
  FileSystemModule = {
    documentDirectory: '',
    cacheDirectory: '',
    writeAsStringAsync: async () => {},
    readAsStringAsync: async () => ''
  };
} else {
  try {
    // Определяем доступные директории
    const documentDir = FileSystem.documentDirectory || RNFS.DocumentDirectoryPath + '/';
    const cacheDir = FileSystem.cacheDirectory || RNFS.CachesDirectoryPath + '/';
    
    FileSystemModule = {
      documentDirectory: documentDir,
      cacheDirectory: cacheDir,
      readAsStringAsync: async (uri) => {
        try {
          return await FileSystem.readAsStringAsync(uri);
        } catch (e) {
          // Fallback на RNFS
          return await RNFS.readFile(uri, 'utf8');
        }
      },
      writeAsStringAsync: async (uri, contents) => {
        try {
          // Пробуем использовать новый API
          const { File } = require('expo-file-system/next');
          const file = new File(uri);
          await file.write(contents);
        } catch (e) {
          try {
            // Пробуем старый API expo-file-system
            return await FileSystem.writeAsStringAsync(uri, contents);
          } catch (e2) {
            // Финальный fallback на RNFS
            return await RNFS.writeFile(uri, contents, 'utf8');
          }
        }
      }
    };
    
    console.log('FileSystem initialized:', {
      documentDirectory: !!FileSystemModule.documentDirectory,
      cacheDirectory: !!FileSystemModule.cacheDirectory
    });
    
  } catch (e) {
    console.warn('expo-file-system not available', e);
    // Последний шанс - только RNFS
    try {
      FileSystemModule = {
        documentDirectory: RNFS.DocumentDirectoryPath + '/',
        cacheDirectory: RNFS.CachesDirectoryPath + '/',
        writeAsStringAsync: async (uri, contents) => RNFS.writeFile(uri, contents, 'utf8'),
        readAsStringAsync: async (uri) => RNFS.readFile(uri, 'utf8')
      };
    } catch (e2) {
      FileSystemModule = {
        documentDirectory: '',
        cacheDirectory: '',
        writeAsStringAsync: async () => {},
        readAsStringAsync: async () => ''
      };
    }
  }
}

export default FileSystemModule;