# Expo + Firebase スマホアプリ（記事投稿機能付き）

このリポジトリは **Expo (React Native)** と **Firebase** を用いて作成する、  
**ログイン機能付き記事投稿アプリ** の最小構成サンプルです。  

- 対応プラットフォーム: **iOS / Android**
- 認証: Firebase Authentication (Email/Password)
- データベース: Firebase Firestore
- 配布: Expo EAS Build → App Store / Google Play

---

## 🔹 構成図

```
Expo App (iOS/Android)
   │
   ├─ Firebase Authentication（ログイン）
   │
   └─ Firestore（記事データ保存/取得）
```

---

## 🔹 セットアップ

### 1. Expo プロジェクト作成（本リポジトリは `firebasetest` を利用）

```bash
npx create-expo-app firebasetest
cd firebasetest
npm install firebase react-native-paper expo-router
```

### 2. Firebase プロジェクト作成
- Firebase Console で新規プロジェクト作成
- Authentication → Email/Password を有効化
- Firestore データベースを有効化

---

## 🔹 環境変数設定

### 1. パッケージ導入
```bash
npm install react-native-dotenv
```

### 2. `.env` 作成
```env
EXPO_PUBLIC_FIREBASE_API_KEY=xxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:xxxxxxxxxxxx
```

### 3. `babel.config.js`
```js
plugins: [
  ["module:react-native-dotenv", {
    "moduleName": "@env",
    "path": ".env"
  }]
]
```

---

## 🔹 Firebase 設定

`firebaseConfig.ts`

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID,
} from "@env";

const firebaseConfig = {
  apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 🔹 画面構成 (Expo Router)

```
app/
 ├─ _layout.tsx     // ナビゲーション枠
 ├─ login.tsx       // ログイン/新規登録
 ├─ index.tsx       // 記事一覧
 └─ post.tsx        // 記事投稿
```

---

## 🔹 コード例

### 1. ログイン画面

`app/login.tsx`

```tsx
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput, Text } from "react-native-paper";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch {
      setError("ログイン失敗");
    }
  };

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch {
      setError("登録失敗");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16 }}>
      <TextInput label="Email" value={email} onChangeText={setEmail} />
      <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text>{error}</Text> : null}
      <Button mode="contained" onPress={handleLogin} style={{ marginTop: 8 }}>ログイン</Button>
      <Button onPress={handleSignup} style={{ marginTop: 8 }}>新規登録</Button>
    </View>
  );
}
```

---

### 2. 記事一覧画面

`app/index.tsx`

```tsx
import { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { auth, db } from "../firebaseConfig";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button onPress={() => router.push("/post")}>記事を投稿する</Button>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text variant="titleLarge">{item.title}</Text>
            <Text>{item.content}</Text>
            <Text style={{ color: "gray" }}>by {item.userEmail}</Text>
          </View>
        )}
      />
      <Button onPress={() => auth.signOut().then(() => router.replace("/login"))}>ログアウト</Button>
    </View>
  );
}
```

---

### 3. 投稿画面

`app/post.tsx`

```tsx
import { useState } from "react";
import { View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { auth, db } from "../firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function Post() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    await addDoc(collection(db, "posts"), {
      title,
      content,
      userEmail: auth.currentUser.email,
      createdAt: serverTimestamp(),
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput label="タイトル" value={title} onChangeText={setTitle} />
      <TextInput label="本文" value={content} onChangeText={setContent} multiline style={{ marginTop: 8 }} />
      <Button mode="contained" onPress={handleSubmit} style={{ marginTop: 8 }}>投稿</Button>
    </View>
  );
}
```

---

## 🔹 デプロイ（ストア公開）

Expo SDK 53 では Google Play / App Store への公開は **EAS (Expo Application Services)** を利用します。

### 1. EAS CLI のセットアップ
```bash
npm install -g eas-cli
eas login
```

### 2. EAS 設定ファイルの追加
プロジェクト直下に `eas.json` を用意します（本リポジトリは同梱済み）。
```json
{
  "build": {
    "production": {
      "android": { "buildType": "app-bundle" }
    },
    "preview": {
      "android": { "buildType": "apk" }
    }
  }
}
```
👉 `app-bundle` は Google Play 提出用の `.aab` を生成します。

### 3. アプリのメタ情報設定（必須）
`app.json` に `android.package` と `versionCode` を設定してください。
```jsonc
{
  "expo": {
    "android": {
      "package": "com.yourname.blogapp", // 一意のパッケージ名
      "versionCode": 1
    }
  }
}
```
※ `android.package` は Play Store 上でユニークである必要があります。

### 4. Android アプリのビルド
```bash
eas build -p android --profile production
```
初回は Expo が Keystore（署名鍵）を自動生成します。ビルド完了後、Expo ダッシュボードから `.aab` をダウンロードできます。

プレビュー用に `.apk` を直接配布する場合：
```bash
eas build -p android --profile preview
```

### 5. Google Play Console で公開
1. 開発者登録（年 25 USD）。
2. 「アプリを作成」→ アプリ名・言語・カテゴリを入力。
3. 「リリース」セクションでビルドした `.aab` をアップロード。
4. ストア情報（説明文・スクリーンショット・プライバシーポリシーURL）を登録。
5. 審査に提出 → 承認後に公開。

✅ まとめ
- `eas-cli` で `.aab` をビルド
- `android.package` をユニークに設定
- Google Play Console に `.aab` を提出

---

✅ これで **スマホアプリ専用** の記事投稿アプリが完成します。  
バックエンドは Firebase Auth + Firestore のみ、Hosting は不要です。

