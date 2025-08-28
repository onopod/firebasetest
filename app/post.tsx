import { useState } from 'react';
import { View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { auth, db } from '../firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function Post() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, 'posts'), {
      title,
      content,
      userEmail: auth.currentUser.email ?? undefined,
      createdAt: serverTimestamp(),
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="タイトル" value={title} onChangeText={setTitle} />
      <TextInput label="本文" value={content} onChangeText={setContent} multiline style={{ marginTop: 8 }} />
      <Button mode="contained" onPress={handleSubmit} style={{ marginTop: 8 }}>
        投稿
      </Button>
    </View>
  );
}


