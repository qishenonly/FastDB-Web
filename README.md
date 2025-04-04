# FastDB 数据库管理系统

## 项目简介

FastDB 是一个轻量级的键值对数据库管理系统，专为快速开发和简单数据存储而设计。本项目包含完整的前后端实现，提供直观的Web界面进行数据管理、分析和可视化。

![FastDB 仪表盘](./screenshots/dashboard.png)

## 主要特性

- **简单高效的键值存储**：支持字符串、数字、对象和数组等多种数据类型
- **直观的Web管理界面**：美观易用的界面，支持数据的增删改查
- **实时数据分析**：内置多种图表，直观展示数据分布和使用情况
- **数据导入导出**：支持JSON格式的数据导入导出
- **多语言支持**：内置中文和英文界面
- **深色/浅色主题**：支持多种主题模式，保护视力
- **响应式设计**：适配不同尺寸的屏幕和设备
- **Docker支持**：提供Docker部署方案，快速搭建环境

## 技术栈

### 前端
- Vue 3 + Composition API
- Vuex 4 状态管理
- Vue Router 4 路由管理
- Element Plus UI组件库
- ECharts 数据可视化
- SCSS 样式预处理
- Axios HTTP客户端

### 后端
- Golang 语言
- 自研键值存储引擎
- RESTful API设计

## 系统架构

![系统架构图](./screenshots/architecture.png)

FastDB采用前后端分离的架构：
- 前端负责用户界面和交互逻辑
- 后端提供RESTful API和数据存储服务
- 通过HTTP协议进行通信

## 快速开始

### 使用Docker部署（推荐）

1. 确保已安装Docker和Docker Compose
2. 克隆项目仓库
   ```bash
   git clone https://github.com/qishenonly/FastDB-Web.git
   cd FastDB-Web
   ```
3. 启动服务
   ```bash
   docker-compose up -d
   ```
4. 访问Web界面：http://localhost:10000

### 手动部署

#### 后端
1. 进入后端目录
   ```bash
   cd backend
   ```
2. 安装依赖
   ```bash
   npm install
   ```
3. 启动服务
   ```bash
   npm start
   ```
   
#### 前端
1. 进入前端目录
   ```bash
   cd frontend
   ```
2. 安装依赖
   ```bash
   npm install
   ```
3. 开发模式启动
   ```bash
   npm run serve
   ```
4. 构建生产版本
   ```bash
   npm run build
   ```

## 项目结构

```
fastdb/
├── backend/                # 后端代码
│   ├── src/                # 源代码
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   ├── data/               # 数据存储目录
│   ├── package.json        # 依赖配置
│   └── server.js           # 入口文件
│
├── frontend/               # 前端代码
│   ├── public/             # 静态资源
│   ├── src/                # 源代码
│   │   ├── assets/         # 资源文件
│   │   ├── components/     # 组件
│   │   ├── i18n/           # 国际化
│   │   ├── router/         # 路由
│   │   ├── services/       # API服务
│   │   ├── store/          # 状态管理
│   │   ├── styles/         # 样式文件
│   │   ├── utils/          # 工具函数
│   │   └── views/          # 页面视图
│   ├── package.json        # 依赖配置
│   └── vue.config.js       # Vue配置
│
├── docker-compose.yml      # Docker Compose配置
├── screenshots/            # 项目截图
└── README.md               # 项目说明
```

## 功能展示

### 仪表盘
![仪表盘](./screenshots/dashboard.png)

### 数据管理
![数据管理](./screenshots/database.png)

### 数据分析
![数据分析](./screenshots/analysis.png)

### 系统设置
![系统设置](./screenshots/settings.png)

## API文档

FastDB提供了完整的RESTful API，支持所有数据操作。

### 键值操作

| 方法   | 路径          | 描述         |
|--------|--------------|--------------|
| GET    | /api/v1/kv   | 获取所有键值对 |
| GET    | /api/v1/kv/:key | 获取指定键的值 |
| POST   | /api/v1/kv   | 创建新的键值对 |
| PUT    | /api/v1/kv/:key | 更新指定键的值 |
| DELETE | /api/v1/kv/:key | 删除指定键值对 |

### 数据库连接

| 方法   | 路径          | 描述         |
|--------|--------------|--------------|
| GET    | /api/v1/db/status | 获取数据库连接状态 |
| POST   | /api/v1/db/connect | 连接到数据库 |
| POST   | /api/v1/db/close | 关闭数据库连接 |

## 开发指南

### 添加新功能

1. 在前端创建新的组件和视图
2. 在后端实现相应的API接口
3. 更新路由和状态管理
4. 添加国际化支持

### 代码规范

- 使用ESLint进行代码检查
- 遵循Vue风格指南
- 使用JSDoc注释函数和类
- 使用语义化的命名

## 贡献指南

1. Fork项目仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目维护者：[您的姓名]
- 邮箱：[您的邮箱]
- 项目链接：[GitHub仓库地址]

---

FastDB - 毕业设计项目 © 2026
