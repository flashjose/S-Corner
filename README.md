# S-Corner

开源英语真题刷题学习平台，支持 CET4/CET6/考研/专四专八真题 PDF 在线阅读、划词查词、句子翻译、标注高亮与生词本。

## 功能

- 按考试分类浏览历年真题
- PDF 在线阅读（缩放、虚拟滚动）
- 划词查词与句子翻译
- 高亮 / 下划线标注（持久化）
- 查答案、听力播放器、听力原文
- 生词本与掌握度管理

## 技术栈

- 前端：React 19 + TypeScript + Vite + Tailwind CSS
- 后端：Spring Boot 3 + Java 21 + MySQL
- PDF：pdf.js

## 快速开始

### 前置条件

- Node.js 18+
- Java 21
- MySQL 8

### 1. 数据库

```sql
CREATE DATABASE s_corner CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 后端

```bash
cd server-java
# 复制 .env.example 到环境变量或 application-local.yml
mvn spring-boot:run
```

环境变量见根目录 [`.env.example`](.env.example)：

- `DB_USERNAME` / `DB_PASSWORD` / `DB_URL`
- `CORS_ORIGINS`（默认 `http://localhost:5173`）

后端默认端口：`3001`

### 3. 前端

```bash
npm install
npm run dev
```

前端默认端口：`5173`

### 4. 试卷 PDF

将 PDF 放入：

```
public/pdfs/{categorySlug}/{year}-{month}/{setId}.pdf
```

例：`public/pdfs/cet4/2025-12/01.pdf`

### 5. 导入答案 / 音频 / 听力原文

编辑 [`scripts/content.example.json`](scripts/content.example.json)，然后：

```bash
# 确保后端已启动
node scripts/import-content.mjs scripts/content.example.json
```

### 6. 导入本地词典（ECDICT）

[ECDICT 发布包](https://github.com/skywind3000/ECDICT/releases)（如 1.0.28）通常提供 **SQLite / MDX / 欧路 `.eudic`** 等格式，**不含可直接导入的 CSV**。推荐：

1. 下载 **`ecdict-sqlite-28.zip`**（有音标，约 217 MB）
2. 解压得到 `.db` 文件（`ecdict-sqlite-28.zip` 里通常是 **`stardict.db`**）
3. 导入 MySQL：

```bash
npm install
npm run import-ecdict-sqlite -- data/stardict.db
# 或指向解压目录：npm run import-ecdict-sqlite -- data
```

**`.eudic` / `.mdx` 不能用于本项目的导入脚本**（欧路/MDict 专用二进制格式）。你已有的 `简明英汉增强版.eudic` 与上述 SQLite 是同一词库的不同封装，请用 SQLite 包导入 S-Corner。

可选方式：

| 来源 | 命令 |
|------|------|
| SQLite（推荐） | `npm run import-ecdict-sqlite -- path/to/ecdict.db` |
| CSV 样例（6 词，联调） | `npm run import-ecdict -- scripts/ecdict.sample.csv` |
| 全量 CSV | 需从 [ECDICT 主仓库](https://github.com/skywind3000/ECDICT) 获取 `ecdict.csv` 或自行用 `stardict.py` 转换：`npm run import-ecdict -- path/to/ecdict.csv` |

环境变量：`DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`（默认与后端一致）。全量导入需数分钟，请保持 MySQL 运行。

查词会**优先走本地词库**，未命中再回退 `dictionaryapi.dev`。可通过 `DICT_LOCAL_ENABLED`、`DICT_REMOTE_FALLBACK` 控制。

## 项目结构

```
src/                 # React 前端
server-java/         # Spring Boot 后端
public/pdfs/         # 真题 PDF（用户自行放置）
scripts/             # 内容导入脚本
```

## 遗留 RSS 模块

RSS/文章阅读相关 API 已用 `@Profile("legacy")` 隔离，默认不启用。如需启用：

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=legacy
```

## 许可证

MIT
