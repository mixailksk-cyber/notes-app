import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const BRAND_COLOR = '#008080';

export default function App() {
  const [notes, setNotes] = useState([
    { id: '1', title: 'Заметка 1', content: 'Пример содержания', color: BRAND_COLOR }
  ]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.header, { backgroundColor: BRAND_COLOR }]}>
        <Text style={styles.headerTitle}>Notes App</Text>
      </View>
      
      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <View style={styles.noteRow}>
            <View style={[styles.colorCircle, { backgroundColor: item.color }]} />
            <Text>{item.title}</Text>
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  noteRow: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  colorCircle: { width: 20, height: 20, borderRadius: 10, marginRight: 10 }
});