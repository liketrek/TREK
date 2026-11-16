# 后台管理测试用例与执行报告

- 版本：TREK 本地开发实例（server `http://localhost:3001`，client `http://localhost:5173`）
- 执行日期：2026-11-14
- 执行方式：Playwright + 本机 Microsoft Edge（`channel: 'msedge'`），真实登录态会话复用
- 桌面端视口：1440 × 1000；手机端视口：390 × 844（iPhone 13，`isMobile` + 触摸）
- 结果：桌面端 30/30 通过，手机端 22/22 通过，未发现 5xx 或页面脚本错误

---

## 1. 环境与账号

| 项目 | 说明 |
| --- | --- |
| 前端入口 | `http://localhost:5173`（必须用 `localhost`，`127.0.0.1` 会被 CORS 拒绝） |
| 后端入口 | `http://localhost:3001`，前端通过 Vite 代理访问 `/api/*` |
| 界面语言 | `en-US`（跟随浏览器 locale，已另验证简体中文切换） |
| 管理员账号 | `e2e@trek.local` / `Trek!E2e2026`（测试期间临时提升为 `admin`，结束后还原为 `user`） |
| 内置管理员 | `admin@trek.local`（role=admin） |
| 普通用户 | `qa1@trek.local`、`qa2@trek.local` / `Trek!Qa2026`（管理端创建，用于列表/邀请验证） |
| 会话文件 | `storage.json`（普通用户）、`storage-admin.json`（管理员） |

> 权限提升方式：测试脚本用 `better-sqlite3` 执行
> `update users set role='admin' where email='e2e@trek.local'`，
> 在 `finally` 中还原为 `user`，避免污染账号权限。

---

## 2. 补充的测试数据

| 数据 | 内容 | 创建方式 |
| --- | --- | --- |
| 用户 | `qa1`、`qa2`（role=user） | 管理后台 → Users → Create User |
| 打包模板 | `Weekend City Break` | 管理后台 → Personalization → New Template |
| 模板分类 | `Clothing`、`Gear` | 模板详情 → Add category |
| 模板条目 | `T-shirt`、`Socks`、`Power bank`（Clothing）；`Charger`（Gear） | 分类行 → Add → 输入回车 |
| 地点分类 | `E2E Test`（共 11 个分类） | Personalization → New Category |
| 邀请链接 | 5 条，其中 3 条为 `3 次 / 14 天`，最近一条 `id=5` | Users → Create Link → Create & Copy |
| 审计日志 | 42 条，含 `admin.user_create`、`admin.invite_create`、`admin.packing_template_create` | 上述操作自动写入 |
| 业务数据（复用） | 3 个行程、7 个地点、1 个文件 | 前置全流程 E2E |

数据量核对（`server/data/travel.db`）：

```
users=4  trips=3  places=7  trip_files=1
packing_templates=1  template_categories=2  template_items=4
categories=11  invite_tokens=5  audit_log=42  notifications=0
```

---

## 3. 桌面端用例

### 3.1 加载与概览

| 编号 | 用例 | 前置条件 | 步骤 | 预期结果 | 实际结果 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| ADM-001 | 后台页可加载 | 管理员登录态 | 打开 `/admin`，等待导航渲染 | 侧边栏出现 Users/User Defaults/…/Audit | 导航完整渲染 | 通过 |
| ADM-002 | 首屏无加载错误 | 同上 | 加载完成后检查页面文案 | 不出现 `Failed to load admin data` | 未出现 | 通过 |
| ADM-003 | 统计卡片渲染 | 同上 | 读取概览卡片 | 显示 `N USERS` 等统计 | 显示 `USERS / TRIPS / PLACES / FILES` 卡片（数值动画递增） | 通过 |
| ADM-021 | MCP 门控 | MCP 扩展未启用 | 打开导航观察 | 不显示 `MCP Access` | 未显示 | 通过 |
| ADM-022 | devMode 门控 | 实例开启 devMode | 打开导航观察 | 显示 `Dev: Notifications` | 已显示 | 通过 |

### 3.2 各管理 Tab 可达性

| 编号 | Tab | 步骤 | 预期结果（面板唯一文案） | 实际结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| ADM-010 | Users | 点击侧边栏 Users | 出现 `Invite Links` 区块 | 出现 | 通过 |
| ADM-011 | User Defaults | 点击 User Defaults | 出现 `Default User Settings` | 出现 | 通过 |
| ADM-012 | Personalization | 点击 Personalization | 出现 `Packing Templates` | 出现 | 通过 |
| ADM-013 | Settings | 点击 Settings | 出现 `Authentication Methods` | 出现 | 通过 |
| ADM-014 | Addons | 点击 Addons | 出现 `Enable or disable features` | 出现 | 通过 |
| ADM-015 | Plugins | 点击 Plugins | 出现 `Install and manage third-party plugins` | 出现（Installed 0 / Discover） | 通过 |
| ADM-016 | Storage | 点击 Storage | 出现 `Backends` | 出现 | 通过 |
| ADM-017 | Notifications | 点击 Notifications | 出现 `Email (SMTP)` 卡片 | 出现（含 Admin Webhook / Admin Ntfy） | 通过 |
| ADM-017b | 通知矩阵 | 停留在 Notifications | 通知偏好矩阵渲染列头或空态提示 | 出现 `In-App` 列头 | 通过 |
| ADM-018 | GitHub | 点击 GitHub | 出现 `Release History` | 出现 | 通过 |
| ADM-019 | Backup | 点击 Backup | 出现 `Data Backup` | 出现 | 通过 |
| ADM-020 | Audit | 点击 Audit | 出现 `Security-sensitive and administration events` | 出现 | 通过 |

> 注意：`Notifications` 与顶栏通知铃铛同名。自动化必须把点击范围限定在 `aside nav` 内，
> 否则会误点铃铛打开通知弹层（本次已修正）。

### 3.3 个性化配置（数据维护）

| 编号 | 用例 | 前置条件 | 步骤 | 预期结果 | 实际结果 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| ADM-029 | 进入个性化配置 | 管理员 | Personalization → 等待面板 | 显示 Packing Templates 区域 | 正常 | 通过 |
| ADM-030 | 新建打包模板 | 无同名模板 | New Template → 输入 `Weekend City Break` → 回车 | 列表出现新模板，审计写入 `admin.packing_template_create` | 已创建并落库 | 通过 |
| ADM-031 | 模板分类 | 模板已存在 | 展开模板 → Add category → 输入 `Clothing`/`Gear` | 两个分类在详情中可见 | 两个分类可见 | 通过 |
| ADM-032 | 模板条目 | 分类已存在 | 分类行 Add → 输入条目 → 回车 | 4 个条目可见且归属正确 | `T-shirt, Socks, Power bank / Charger` | 通过 |
| ADM-033 | 新建地点分类 | 管理员 | New Category → 输入 `E2E Test` → Create | 分类列表出现 `E2E Test` | 已出现（分类总数 11） | 通过 |

> 条目输入框在提交后保持展开，可连续录入；再次点 `+` 会收起输入框（非缺陷，已按此行为调整用例步骤）。

### 3.4 用户与邀请

| 编号 | 用例 | 前置条件 | 步骤 | 预期结果 | 实际结果 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| ADM-040 | 创建用户 | 管理员 | Create User → 填用户名/邮箱/密码 → 提交 | 列表出现新用户，审计写入 `admin.user_create` | `qa2` 创建成功 | 通过 |
| ADM-041 | 创建用户弹窗取消 | 管理员 | Create User → Cancel | 弹窗关闭且不新增用户 | 正常关闭 | 通过 |
| ADM-050 | 创建邀请链接 | 管理员 | Create Link → 选 `3×`、`14d` → Create & Copy | 新增记录 `max_uses=3`、14 天有效期，审计写入 | `max_uses=3`，到期 2026-11-28 | 通过 |
| ADM-051 | 复制提示 | 同上 | 创建后检查提示 | 出现 `Invite link copied to clipboard` | 已出现 | 通过 |

### 3.5 审计与整体健康度

| 编号 | 用例 | 步骤 | 预期结果 | 实际结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| ADM-060 | 审计记录 | 打开 Audit，等待列表 | 出现 `admin.user_create` / `admin.invite_create` 等记录 | 42 条记录，含最近操作 | 通过 |
| ADM-070 | 全流程加载稳定 | 走完全部 Tab 后回到 Users | 不出现 `Failed to load admin data` | 未出现 | 通过 |
| ADM-071 | 无服务端错误 | 全程监听 `/api/*` 响应 | 无 5xx | 无 5xx、无 4xx | 通过 |

---

## 4. 手机端用例（390 × 844）

入口同为 `/admin`，通过标题按钮 `Administration` 打开区块下拉切换分区。

| 编号 | 用例 | 步骤 | 预期结果 | 实际结果 | 结论 |
| --- | --- | --- | --- | --- | --- |
| M-001 | 后台页加载 | 打开 `/admin` | 渲染移动端顶部标题按钮 | 正常 | 通过 |
| M-002 | 统计卡片 | 加载完成 | 显示 `N USERS` 等统计 | 正常 | 通过 |
| M-003 | 用户列表 | 默认 Users 分区 | 列表含 `qa2` | 已包含 | 通过 |
| M-004 | 邀请区块 | 默认 Users 分区 | 出现 `Invite Links` | 已出现 | 通过 |
| M-005 | 创建用户弹层 | 点 Create User → Cancel | 底部弹层打开并可取消 | 正常 | 通过 |
| M-010 | User Defaults 分区 | 下拉切换 | 出现 `Default User Settings` | 正常 | 通过 |
| M-011 | Personalization 分区 | 下拉切换 | 出现 `Packing Templates` | 正常 | 通过 |
| M-012 | Settings 分区 | 下拉切换 | 出现 `Authentication Methods` | 正常 | 通过 |
| M-013 | Addons 分区 | 下拉切换 | 出现 `Enable or disable features` | 正常 | 通过 |
| M-014 | Plugins 分区 | 下拉切换 | 出现插件管理文案 | 正常 | 通过 |
| M-015 | Storage 分区 | 下拉切换 | 出现 `Backends` | 正常 | 通过 |
| M-016 | Notifications 分区 | 下拉切换 | 出现 `Email (SMTP)` | 正常 | 通过 |
| M-017 | GitHub 分区 | 下拉切换 | 出现 `Release History` | 正常 | 通过 |
| M-018 | Backup 分区 | 下拉切换 | 出现 `Data Backup` | 正常 | 通过 |
| M-019 | Audit 分区 | 下拉切换 | 出现审计说明与列表 | 正常 | 通过 |
| M-020 | MCP 门控 | 展开下拉 | 不出现 `MCP Access` | 未出现 | 通过 |
| M-021 | devMode 门控 | 展开下拉 | 出现 `Dev: Notifications` | 已出现 | 通过 |
| M-030 | 测试模板可见 | Personalization 分区 | 出现 `Weekend City Break` | 已出现 | 通过 |
| M-031 | 测试分类可见 | Personalization 分区 | 出现 `E2E Test` | 已出现 | 通过 |
| M-040 | 邀请列表有数据 | Users 分区 | 邀请列表非空 | 5 条邀请 | 通过 |
| M-050 | 无加载错误 | 全程 | 无 `Failed to load admin data` | 未出现 | 通过 |
| M-051 | 无服务端错误 | 全程 | 无 5xx | 无 5xx、无 4xx | 通过 |

移动端截图：`out/m-001-users.png` … `out/m-019-audit.png`。

---

## 5. 本次修复

### 5.1 后台偶发 “Failed to load admin data”

- 现象：在管理后台执行“创建用户 / 创建邀请链接”期间，页面偶发弹出
  `Error — Failed to load admin data`（React StrictMode 下双份提示）。
- 根因：`client/src/pages/admin/useAdmin.ts` 的 `loadData` 用单个 `Promise.all`
  聚合 users / stats / invites / invite-trips 四个请求。任一请求被中断
  （开发态热更新重载、代理瞬时抖动、请求被取消）都会让整页数据加载失败并弹全局错误，
  即使用户列表本身可用。
- 修复：改为 `Promise.allSettled`，四个数据源分别落地；仅当**用户列表**
  请求失败时才提示 `admin.toast.loadError`，统计/邀请失败时保留可用数据与已有空态。
- 单元测试：新增 `FE-ADMHOOK-002b`（stats 500 时用户列表仍渲染且不弹 toast），
  `useAdmin.test.tsx` 全部 63 项通过；ESLint 0 error（仅存量 warning）。

### 5.2 移动端地图预览中心

- `MAdminDefaultUserSettings.tsx` 复用 `PREVIEW_CENTER`（上海），与桌面端一致，
  移动端 59 项测试通过。

---

## 6. 已知限制与说明

1. `MCP Access` 仅在 MCP 扩展启用时显示，本实例未启用，故未覆盖 Token 增删用例。
2. `Dev: Notifications` 因实例 devMode 开启而可见，属于预期行为。
3. 通知通道（SMTP/Webhook/Ntfy）均未配置，通知偏好矩阵显示为通道未配置状态，未做投递验证。
4. 邀请链接当前未绑定行程（`trip_id=null`），因创建弹窗未提供行程选择项。
5. 自动化在开发态执行，首屏 Vite 编译较慢（约 6–10s），用例使用 30–90s 的显式等待，
   不作为性能结论。

---

## 7. 测试数据清理建议（如不需要保留）

```sql
delete from packing_template_items where category_id in
  (select id from packing_template_categories where template_id in
    (select id from packing_templates where name='Weekend City Break'));
delete from packing_template_categories where template_id in
  (select id from packing_templates where name='Weekend City Break');
delete from packing_templates where name='Weekend City Break';
delete from categories where name='E2E Test';
delete from invite_tokens where id >= 1;      -- 按需保留
delete from users where email in ('qa1@trek.local','qa2@trek.local');
```

> 删除用户前请确认无外键引用（行程/协作者/审计日志）。建议优先在管理后台 UI 删除。

---

## 8. 附件

- 桌面端结果 JSON：`out/adm-desktop.json`
- 手机端结果 JSON：`out/adm-mobile.json`
- 截图：`out/d-*.png`、`out/m-*.png`
（临时目录：`C:\Users\Administrator\AppData\Local\Temp\trek-e2e\`）
