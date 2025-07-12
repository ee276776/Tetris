# 🎮 俄羅斯方塊遊戲

經典俄羅斯方塊遊戲，支援線上高分榜、用戶註冊登入功能。

## 🌐 線上遊玩

直接訪問：**[您的GitHub Pages網址]**(部署後填入)

## 🚀 快速開始

### 本地運行
直接開啟 `index.html` 即可遊玩！

### 部署到您的 GitHub Pages
1. Fork 這個專案
2. 在 GitHub 儲存庫設定中啟用 Pages
3. 立即可用！

## 🛡️ 關於 Firebase 配置安全性

**Q: Firebase 配置公開在程式碼中安全嗎？**

**A: 完全安全！** 這是 Google Firebase 的官方設計：

1. **🔑 API 密鑰設計為公開**：Firebase 的 `apiKey` 本來就是要放在前端的
2. **🛡️ 真正的安全由規則控制**：Firestore 安全規則和 Authentication 提供保護
3. **📖 Google 官方文檔確認**：這些配置可以安全地包含在公開代碼中
4. **🌍 授權網域限制**：可以限制只有特定網域能使用

參考：[Firebase 官方文檔 - API Keys](https://firebase.google.com/docs/projects/api-keys)

## 🎯 遊戲功能

- ✅ 經典俄羅斯方塊玩法
- ✅ 用戶註冊/登入系統
- ✅ 個人前10高分記錄
- ✅ 全域排行榜
- ✅ 作弊模式（T鍵清除底行）
- ✅ 響應式設計
- ✅ 雲端資料同步

## ⌨️ 操作說明

- **← →** : 左右移動
- **↑** : 旋轉方塊
- **↓** : 加速下降
- **空白鍵** : 瞬間下降
- **Shift** : 保存/交換方塊
- **T** : 作弊模式（清除最底行）😈

## 🔧 技術架構

- **前端**: HTML5 Canvas + CSS3 + JavaScript ES6
- **後端**: Firebase (Authentication + Firestore)
- **部署**: GitHub Pages
- **特色**: 無伺服器架構，完全免費運行

## � 資料庫結構

```
users/ (用戶資料)
├── user@email.com/
    ├── account: "user@email.com"
    ├── createTime: timestamp
    └── lastLoginTime: timestamp

historyScores/ (分數記錄)
├── [自動ID]/
    ├── account: "user@email.com"
    ├── score: 12500
    └── createTime: timestamp
```

## 🎨 自訂化

您可以修改以下檔案來自訂遊戲：
- `styles.css` - 遊戲外觀和動畫
- `game.js` - 遊戲邏輯和難度
- `firebase-auth.js` - 認證和排行榜邏輯

## 📄 授權

MIT License - 歡迎自由使用、修改和分享！

---

💡 **享受遊戲，創造高分！** 🏆
