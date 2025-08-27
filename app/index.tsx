import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

type Post = {
  id: string;
  title: string;
  content: string;
  userEmail?: string;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Post, 'id'>) })));
    });
    return unsubscribe;
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button onPress={() => router.push('/post')}>記事を投稿する</Button>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text variant="titleLarge">{item.title}</Text>
            <Text>{item.content}</Text>
            {item.userEmail ? <Text style={{ color: 'gray' }}>by {item.userEmail}</Text> : null}
          </View>
        )}
      />
      <Button onPress={() => auth.signOut().then(() => router.replace('/login'))}>ログアウト</Button>
    </View>
  );
}


