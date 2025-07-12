# Firebase 配置設定指南

## 步驟1：建立 Web 應用程式並獲取 Firebase 配置

### ❌ 不要點擊的選項：
- **App Hosting** - 這是用來部署網站的，不是我們要的
- **App Check** - 這是安全性服務
- **Functions** - 這是雲端函數服務

### ✅ 正確的方法：

#### 方法一：從專案設定建立（推薦）
1. 點擊左上角的 **齒輪圖示**（專案設定）
2. 在「一般」標籤中，往下捲動到 **「您的應用程式」** 區域
3. 點擊 **"新增應用程式"** 按鈕
4. 在彈出的選項中，選擇 **Web 圖示 (</>)**

#### 方法二：從專案概覽頁面
1. 在專案概覽頁面中，查看是否有 "首先將 Firebase 添加至您的應用" 區域
2. 尋找 **Web 圖示 (</>)** - 看起來像 HTML 標籤
3. 如果看不到，請使用方法一

### 🔍 如何識別正確的 Web 圖示：
- 圖示看起來像：**`</>`**
- 通常標示為：**"Web"** 或 **"Web app"**
- **不是** App Hosting（那是完全不同的服務）

### 建立應用程式步驟：
1. 點擊 Web 圖示後，會要求您輸入應用程式名稱
2. 輸入名稱（例如：**Tetris Game**）
3. **不要**勾選 "同時為此應用程式設定 Firebase Hosting"
4. 點擊 **"註冊應用程式"**
5. Firebase 會顯示您的配置代碼

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};
```

## 步驟2：替換 index.html 中的配置
找到 index.html 中的這一段：
```javascript
const firebaseConfig = {
    // 請在這裡填入您的 Firebase 配置
    apiKey: "您的API密鑰",
    authDomain: "您的專案.firebaseapp.com",
    projectId: "您的專案ID",
    storageBucket: "您的專案.appspot.com",
    messagingSenderId: "您的發送者ID",
    appId: "您的應用ID"
};
```

將其替換為您從 Firebase 控制台複製的真實配置。

## 步驟3：啟用 Authentication

### 🔍 在哪裡找到 Authentication：
1. **在 Firebase 控制台的左側選單中**，找到 **"Authentication"** 選項
   - 圖示通常是一個人頭或鑰匙圖示
   - 位置在左側選單中間部分，在 "Firestore Database" 的上方或下方

### 📋 詳細設定步驟：
1. **點擊左側選單的「Authentication」**
2. 如果是第一次使用，會看到 **"開始使用"** 按鈕，點擊它
3. 進入後，您會看到頂部有幾個標籤：
   - Users（用戶）
   - **Sign-in method**（登入方式）← 點擊這個標籤
   - Settings（設定）
   - Templates（範本）

4. **在 "Sign-in method" 標籤中**：
   - 您會看到各種登入方式的列表
   - 找到 **"電子郵件/密碼"** 或 **"Email/Password"**
   - 點擊該行進入設定

5. **在電子郵件/密碼設定頁面**：
   - 會看到兩個選項開關
   - **啟用第一個選項**：「電子郵件/密碼」
   - **不要啟用第二個選項**：「電子郵件連結（無密碼登入）」
   - 點擊 **"儲存"** 按鈕

### 🚨 如果找不到 Authentication：
- 確認您在正確的 Firebase 專案中
- 有些新專案可能需要先建立 Web 應用程式才會顯示所有選項
- 請先完成步驟1建立 Web 應用程式

## 步驟4：設定 Firestore 規則
在 Firestore Database > 規則中，使用以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users 集合：只有登入用戶可以讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
    
    // historyScores 集合：登入用戶可以讀取所有記錄，但只能寫入自己的記錄
    match /historyScores/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == resource.data.account;
    }
  }
}
```

## 完整的 API 功能列表

### 已實現的功能：
✅ **用戶註冊**：`firebaseManager.register(email, password)`
✅ **用戶登入**：`firebaseManager.login(email, password)`
✅ **用戶登出**：`firebaseManager.logout()`
✅ **保存分數**：`firebaseManager.saveScore(score)`（遊戲結束時自動呼叫）
✅ **載入個人前10高分**：`firebaseManager.loadUserHighScores()`
✅ **載入全域前10高分**：`firebaseManager.loadGlobalHighScores()`
✅ **檢查新高分**：`firebaseManager.checkIfNewHighScore(score)`
✅ **更新最後登入時間**：`firebaseManager.updateLastLoginTime()`（登入時自動呼叫）

### 自動觸發的時機：
- 用戶登入後：自動載入個人和全域高分榜
- 遊戲結束時：自動保存分數並重新整理高分榜
- 註冊成功後：自動在 users 集合建立用戶資料

### 安全特性：
- 密碼由 Firebase Authentication 安全處理，不存儲在 Firestore
- 每個用戶只能修改自己的資料
- 所有操作都需要用戶登入
- Firestore 規則防止未授權存取

## 測試和診斷步驟

### 🔍 診斷分數沒有保存的問題：

#### 步驟1：檢查瀏覽器控制台
1. 在遊戲頁面按 **F12** 打開開發者工具
2. 點擊 **"Console"** 標籤
3. 玩一場遊戲直到結束
4. 查看是否有錯誤訊息

#### 步驟2：檢查用戶登入狀態
在瀏覽器控制台輸入以下命令來檢查：
```javascript
// 檢查 Firebase 是否已初始化
console.log('Firebase App:', window.firebaseApp);
console.log('Firebase Auth:', window.firebaseAuth);
console.log('Firebase DB:', window.firebaseDb);

// 檢查用戶登入狀態
console.log('Firebase Manager:', window.firebaseManager);
console.log('Current User:', window.firebaseManager?.currentUser);
```

#### 步驟3：檢查 Authentication 設定
1. 前往 [Firebase 控制台](https://console.firebase.google.com/project/tetris-1a620/authentication)
2. 確認 **Email/Password** 已啟用
3. 檢查 **Users** 標籤中是否有您註冊的用戶

#### 步驟4：檢查 Firestore 規則
1. 前往 [Firestore Database](https://console.firebase.google.com/project/tetris-1a620/firestore)
2. 點擊 **"規則"** 標籤
3. 確認規則如下：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // users 集合：只有登入用戶可以讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.token.email == userId;
    }
    
    // historyScores 集合：登入用戶可以讀取所有記錄，但只能寫入自己的記錄
    match /historyScores/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == resource.data.account;
    }
  }
}
```

#### 步驟5：手動測試分數保存
在瀏覽器控制台輸入：
```javascript
// 手動測試保存分數
if (window.firebaseManager && window.firebaseManager.currentUser) {
    window.firebaseManager.saveScore(9999);
    console.log('測試分數已發送');
} else {
    console.log('用戶未登入');
}
```

### 🚨 常見問題和解決方案：

#### 問題1：用戶未登入
**症狀**：遊戲結束時沒有分數保存
**解決**：確保在遊戲前先登入或註冊

#### 問題2：Firestore 規則阻擋
**症狀**：控制台顯示權限錯誤
**解決**：檢查並更新 Firestore 規則

#### 問題3：Authentication 未啟用
**症狀**：無法註冊或登入
**解決**：在 Firebase 控制台啟用 Email/Password 認證

#### 問題4：網路連線問題
**症狀**：請求超時或連線失敗
**解決**：檢查網路連線，重新整理頁面

### 📋 完整測試流程：
1. **開啟遊戲頁面**，按 F12 打開控制台
2. **註冊新帳號**或登入現有帳號
3. **確認用戶資訊顯示**（右上角顯示 email）
4. **開始遊戲**並玩到結束
5. **檢查控制台**是否有錯誤訊息
6. **前往 Firebase 控制台**檢查 historyScores 集合
