# TREK 中国版改造技术评估报告

- **评估对象**：`liketrek/TREK` 本地仓库（v5.1.4，AGPL-3.0）
- **评估日期**：2026-11-17
- **评估方式**：静态代码核对（目录、模块、实体、配置、构建与测试脚本），未包含动态压测、法律意见与供应商商务谈判
- **关联文档**：`docs/china-ai-travel-mvp-design.md`（MVP 方案与开发详设）

---

## 0. 执行摘要

### 结论

1. **TREK 可以作为中国版 AI 旅行管家的技术底座**。行程、地点、日程、预算、预订、协作、离线、MCP、插件等业务骨架已经存在，且工程质量控制（类型、边界、事务、测试门禁）明显高于同规模开源项目。
2. **真正缺失的不是"地图接入"，而是"生成式行程规划领域"**。现有 AI 助手的作用域是"用户已打开的行程"，负责解释、建议和提案式修改；它不具备"从一句需求生成一份新行程"的产品语义。这是 P0 缺口。
3. **第二类 P0 缺口是国内数据合规链路**。高德能力已内置，但默认地点服务仍是 OSM / TREK Places，天气仍直连 Open-Meteo，模型连接默认面向境外供应商。上线前必须做成可配置、可关闭、可审计的 Provider 白名单。
4. **商业化组件基本为零**。没有订阅、支付、权益、佣金、渠道订单模块；只有 AI 用量限额与审计。会员与交易闭环需要新建。
5. **AGPL-3.0 + 商标政策是硬约束**。修改后对外提供网络服务，需履行源码提供义务；TREK 名称与标识不在开源许可范围内。

### 关键数字（代码实测）

| 指标 | 数值 |
|---|---|
| 仓库版本 | 5.1.4 |
| 工作区 | `client` / `server` / `shared` 三个 npm workspace |
| NestJS 领域模块 | 约 95 个目录（`server/src/nest/`） |
| 数据库实体 | 168 个（`server/src/db/entities/`） |
| 后端框架 | NestJS 11.2.5 |
| ORM / 查询 | MikroORM 7.2.7 + Kysely 0.29.6 |
| 数据库 | better-sqlite3（默认）+ PostgreSQL 可选 |
| 前端 | React 19.3.1 + Vite + Dexie + Capacitor 8 |
| 实时协作 | WebSocket（`@nestjs/platform-ws` + `ws`） |
| MCP | `@modelcontextprotocol/sdk` 1.32.2，OAuth 2.1 |
| 部署 | Dockerfile、docker-compose、Helm（`charts/trek`） |

---

## 1. 事实核验：对既有产品判断的技术纠偏

| 既有判断 | 代码事实 | 影响 |
|---|---|---|
| 国内地图与 POI 需要从零接入高德 | **已内置高德 Provider**：`server/src/nest/maps/providers/amap.provider.ts`；通过 `places_provider` 设置在 Google / 高德 / OSM 间切换；环境变量 `AMAP_API_KEY`、`AMAP_API_SECRET`、`AMAP_API_BASE` 已支持 | 工作重点从"接入"变为"默认值、白名单、配额、归因与合规开关" |
| 国内路线规划需另建 | **已内置**：`server/src/nest/routing-relay/amap-directions.client.ts`，坐标转换在 `shared/src/geo/gcj02.ts` | 可直接复用，需补驾车/步行/骑行覆盖与失败降级 |
| AI 可以直接生成整份行程 | **不成立**。`server/src/nest/assistant/assistant.prompt.ts` 明确助手只服务"当前打开的行程"，所有工具不接受 trip id；修改以提案卡形式等待用户确认 | 必须新建 `ai-travel-plan` 领域，Assistant 只能复用其模型连接、SSE 与卡片经验 |
| AI 不能创建行程 | **部分不成立**。MCP 工具层已暴露 `create_trip` / `delete_trip`（`server/src/nest/trips/trips.mcp.ts:111`、`:361`） | "外部 AI 通过 MCP 建行程"可行；但"应用内对话生成完整行程"仍不存在 |
| 首发只做 Web / PWA，不做 App | 仓库已集成 **Capacitor 8**（Android/iOS 全套插件、原生构建脚本） | 这是主动收敛范围，不是能力缺失 |
| 需要从零做中文国际化 | 已内置简体中文：`shared/src/i18n/languages.ts`（`{ value: 'zh', locale: 'zh-CN' }`） | 只需补业务文案质量与中文内容，不需要重建 i18n 框架 |
| 费用分摊是基础能力 | 比预期完整：支持均分、按金额、按票据行拆分，成员退出后重分摊，多币种结算（`server/src/nest/budget/`） | 可直接作为商业化卖点，无需重写 |
| 订单识别需要新建 | **已存在**：`booking-import/`、`reservation-import/`、`receipt-scan/`、`llm-parse/` | 可复用为"订单导入"能力，缺的是供应商交易闭环 |
| 有会员和支付基础 | **不存在**。仅有 AI 用量限额、审计与留存策略；无订阅、支付、权益、佣金模块 | 商业化需要独立建设 |
| 地图合规只涉及审图号 | 还涉及**跨境链路**：`TREK_PLACES_ENABLED` 默认 true（`server/.env.example`），天气固定使用 Open-Meteo（`server/src/nest/weather/weather.impl.ts`） | 必须建立出境数据清单与默认关闭策略 |

---

## 2. 架构现状

### 2.1 仓库布局

```text
client/          React 19 + Vite + Dexie + Capacitor
server/          NestJS 11 应用（约 95 个领域模块）
shared/          跨端 schema、类型、i18n、geo、money 等
plugin-sdk/      第三方插件 SDK
charts/trek/     Helm Chart
docs/            设计与运维文档
scripts/         CI、lint、代码生成脚本
```

### 2.2 后端分层

- **入口与平台层**：`server/src/nest/app.module.ts`、`platform/platform.routes.ts`（静态资源 `/uploads/*` 等路由在此挂载）。
- **领域层**：`server/src/nest/<domain>/`，每个领域包含 `*.module.ts`、`*.controller.ts`、`*.service.ts`、`*.dto.ts`，部分含 `*.mcp.ts` 暴露 MCP 工具。
- **数据访问层**：MikroORM 实体 + repository（`server/src/db/entities/`、`server/src/db/repositories/`），写操作要求走事务与 `UnitOfWork`。
- **横切能力**：`audit/`、`permissions/`、`settings/`、`storage/`、`notifications/`、`common/`。

### 2.3 前端分层

```text
client/src/pages/        页面（dashboard、Trips、tripPlanner、journey、settings…）
client/src/components/   领域组件
client/src/api/          HTTP 客户端
client/src/repo/         本地 Dexie 仓储（离线）
client/src/sync/         离线队列、连接探测、瓦片预取
client/src/store/        状态管理
client/src/db/           Dexie 表与缓存
```

`client/src/pages/tripPlanner/` 已包含大量按关注点拆分的 hook（`useDayPlanEdits`、`usePlaceEdits`、`useTripPlanner` 等），说明"行程编辑器"本身成熟且高度组件化。

### 2.4 关键领域模块评级

| 领域 | 目录 | 评级 | 说明 |
|---|---|---|---|
| 行程 | `server/src/nest/trips/` | 保留 | 含 `trips.service.ts`、`trip-writes.service.ts`、`trips.mcp.ts` |
| 日程 | `server/src/nest/days/`、`assignments/` | 保留 | 天与地点分配是规划写入的落点 |
| 地点 | `server/src/nest/places/`、`place-photos/` | 保留 + 改造 | 需强制境内 Provider 与图片授权 |
| 地图/POI | `server/src/nest/maps/` | 改造 | Provider 选择、归一化、缓存策略已具备 |
| 路线 | `server/src/nest/routing-relay/` | 改造 | 已有高德实现，需补模式与降级 |
| 天气 | `server/src/nest/weather/` | 改造 | 目前固定 Open-Meteo，需要 Provider adapter |
| 预算 | `server/src/nest/budget/` | 保留 | 分摊与结算完整 |
| 预订 | `server/src/nest/reservations/`、`booking-import/`、`receipt-scan/` | 保留 | 缺真实供应商交易 |
| 协作 | `server/src/nest/realtime/`、`collab/`、`trip-members/` | 保留 | WebSocket + 权限 |
| 游记 | `server/src/nest/journey/`、`journey-recordings/` | 保留 | 含照片、书籍、公开分享 |
| AI 助手 | `server/src/nest/assistant/` | 选择性复用 | 不能承担从零规划 |
| 模型连接 | `server/src/nest/ai-connections/` | 保留 + 扩展 | 多 Provider、限额、审计 |
| MCP | `server/src/nest/mcp-transport/`、`mcp-shared/` | 保留 | OAuth 2.1、工具白名单 |
| 插件 | `server/src/nest/plugins/`、`plugin-sdk/` | 保留 | 签名状态、kill-switch、代理 |
| 通知/邮件 | `notifications/`、`nodemailer` | 保留 | 国内短信/微信需新增 |

---

## 3. 中国本地化差距清单

| 能力 | 现状（代码位置） | 差距 | 改造建议 | 优先级 |
|---|---|---|---|---|
| 地点搜索 | `maps/places-provider.selector.ts` + `providers/amap.provider.ts` | 默认仍可能走 OSM / TREK Places | 增加"境内强制高德"策略；按城市白名单启用；记录 Provider 与查询时间 | P0 |
| 跨境地点请求 | `TREK_PLACES_ENABLED` 默认 true | 用户输入可能出境 | 生产默认 `false`；如需自建，配置 `TREK_PLACES_URL` | P0 |
| 天气 | `weather/weather.impl.ts` 直连 Open-Meteo | 无 Provider 抽象；跨境 | 抽 `WeatherProvider` 接口；接入国内合规服务；失败时降级为"待确认" | P0 |
| 路线 | `routing-relay/amap-directions.client.ts` | 需确认配额、模式、异常返回 | 封装统一 `RouteEstimator`；对超时与限流给出可重试状态 | P1 |
| 坐标系 | `shared/src/geo/gcj02.ts` | 已具备 | 保持数据库 WGS-84，仅在出入高德时转换 | 保留 |
| 模型供应商 | `ai-connections/` 支持 OpenAI / Anthropic / OpenRouter / ChatGPT 登录 | 国内模型与数据驻留未配置 | 增加 OpenAI 兼容 Provider 配置模板；按用户/实例双模式管理密钥 | P1 |
| 图片 | `place-photos/`、`unsplash/`、本次新增 `amap-photo/` | 授权与归因需确认 | 建立图片授权白名单与缓存策略；前台展示来源 | P1 |
| 登录 | `auth/`、`native-auth/`、`oidc/`、`oauth/`、Passkey | 缺手机号/微信登录 | 新增国内身份 Provider；保持 session 与权限模型不变 | P1 |
| 支付/会员 | 无 | 完全缺失 | 新建 billing 领域，独立于行程领域 | P1 |
| 内容/攻略 | 无中文内容体系 | 缺冷启动内容 | 先做"行程模板 + 游记公开页"，不建内容社区 | P2 |
| 合规 | 无出境数据清单 | 地图、天气、模型、图片、邮件均可能出境 | 建立数据流图、开关矩阵与审计日志 | P0 |

---

## 4. 核心缺口：AI 旅行规划域（`ai-travel-plan`）

### 4.1 为什么不能直接扩展现有 Assistant

`server/src/nest/assistant/assistant.prompt.ts` 的产品语义是"围绕当前行程工作"：

- 工具不接受 trip id，只作用于打开的行程；
- 修改必须经提案卡确认；
- 没有"创建新行程"的对话入口（MCP 的 `create_trip` 不服务于应用内助手）。

因此，把"从零生成行程"塞进 Assistant 会破坏其权限边界、撤销模型与上下文假设。应新建独立领域。

### 4.2 领域模型（新增）

新增实体：

- `server/src/db/entities/AiTravelPlans.entity.ts`
  - `id`、`owner_id`、`status`（`draft|generating|ready|applied|expired|failed`）、`request_json`、`current_revision`、`target_trip_id`、`applied_trip_id`、`expires_at`、时间戳
- `server/src/db/entities/AiTravelPlanRevisions.entity.ts`
  - `id`、`plan_id`、`revision`、`draft_json`、`facts_json`、`warnings_json`、`model_meta_json`、`duration_ms`、`created_at`

迁移文件放入 `server/src/db/migrations/`，遵循现有 `Migration2020010101xxxx_*` 命名。

### 4.3 API（新增）

| API | 用途 | 关键约束 |
|---|---|---|
| `POST /api/ai-travel-plans` | 创建草案并流式生成 | 不写任何行程数据 |
| `GET /api/ai-travel-plans/:id` | 读取草案、事实、警告、版本 | 仅所有者 |
| `POST /api/ai-travel-plans/:id/revisions` | 根据反馈生成新版本 | 保留历史版本 |
| `POST /api/ai-travel-plans/:id/apply` | `mode: new_trip \| existing_trip` | 事务、幂等键、权限校验 |
| `POST /api/ai-travel-plans/:id/discard` | 放弃草案 | 保留审计 |

### 4.4 生成流水线

1. **需求解析**：模型只把自然语言转成 `TravelPlanRequest`，Zod 校验；缺字段先追问。
2. **POI 检索**：服务端调用白名单 Provider（高德），禁止模型自行抓取 URL 或编造地点。
3. **候选筛选**：按兴趣、距离、人群限制过滤，保留来源。
4. **路线估算**：调用 `routing-relay`，得到距离/耗时/方式。
5. **确定性排程**：按开放时段、游玩时长、午餐窗口、每日上限排序；无可靠营业时间时只给提示。
6. **预算计算**：只算交通、活动与用户录入费用；缺价格标"待确认"。
7. **规则校验**：营业时间冲突、重叠、单日超时、预算超限、地点重复。
8. **文本生成**：只把结构化结果转成解释性文字，不改事实字段。
9. **Proposal**：前端展示来源、查询时间、警告，用户确认后应用。

### 4.5 校验规则（MVP）

- 相邻两站路程 > 90 分钟 → warning；
- 单日总时长超过用户节奏上限 → blocking；
- 预算超出上限 → warning 或 blocking（可配置）；
- 地点缺失 provider id / 坐标 → blocking；
- 任何关键事实无来源 → 不得写入草案，转为"待确认"。

### 4.6 应用写入（复用既有领域）

应用服务只调用既有写路径，不新增旁路 SQL：

- `server/src/nest/trips/trip-writes.service.ts`、`trips.service.ts`
- `server/src/nest/days/`、`assignments/`
- `server/src/nest/budget/`
- `server/src/nest/reservations/`（如草案含预订建议）
- 事务与 `UnitOfWork` 沿用现有模式；应用后广播 WebSocket 事件

### 4.7 文件级改动清单

**新增（后端）**

```text
server/src/nest/ai-travel-plan/
  ai-travel-plan.module.ts
  ai-travel-plan.controller.ts
  ai-travel-plan.service.ts
  ai-travel-plan.dto.ts
  planner-prompt.ts
  planner.service.ts        # 解析、检索、排程编排
  planner-validator.ts      # 确定性校验
  planner-apply.service.ts  # 写入 trips/days/places/budget
  planner-provider.ts       # Maps/Route/Weather 白名单封装
server/src/db/entities/AiTravelPlans.entity.ts
server/src/db/entities/AiTravelPlanRevisions.entity.ts
server/src/db/migrations/Migration2026xxxx_ai_travel_plans.ts
```

**新增（共享契约）**

```text
shared/src/ai-travel-plan/
  request.schema.ts
  draft.schema.ts
  warnings.ts
  index.ts
```

**新增（前端）**

```text
client/src/pages/aiTravelPlan/
  AiTravelPlanPage.tsx
  useAiTravelPlan.ts
client/src/components/AiTravelPlan/
  TravelBriefForm.tsx
  TravelDraftTimeline.tsx
  TravelDraftSources.tsx
  TravelDraftWarnings.tsx
  TravelDraftApplyCard.tsx
client/src/api/aiTravelPlan.ts
client/src/store/aiTravelPlanStore.ts
```

**修改（后端）**

```text
server/src/nest/app.module.ts                 # 注册 AiTravelPlanModule
server/src/nest/maps/places-provider.selector.ts
server/src/nest/maps/providers/amap.provider.ts    # 如需城市白名单/配额
server/src/nest/routing-relay/routing-relay.service.ts
server/src/nest/weather/weather.service.ts         # 注入 Provider adapter
server/src/nest/weather/weather.impl.ts            # Open-Meteo 降级为默认实现之一
```

**修改（前端）**

```text
client/src/App.tsx                            # 新增 /plan 路由
client/src/pages/dashboard/                   # 新建入口改为"让 AI 帮我规划"
client/src/i18n/                              # 新增中文文案 key
```

---

## 5. 商业化能力差距

| 能力 | 现状 | 需要新建 |
|---|---|---|
| 订阅与支付 | 无 | `server/src/nest/billing/`（订单、订阅、回调验签）、前端付费墙 |
| AI 权益与计量 | 有每日轮次限额（`app-settings.registry.ts`）与用量记录 | 权益分层、按次/积分、成本核算 |
| 交易佣金 | 无 | 联盟渠道适配器、订单归因、结算对账 |
| 商家供给 | 无 | 商户/商品模型、审核与风控 |
| 增长分析 | 无 | 事件埋点、漏斗、留存与付费转化 |
| 企业版 | 有权限与自托管基础 | 组织、SSO 策略、审计导出、席位计费 |

原则：billing 与 travel-plan 解耦；规划服务只暴露"消耗事件"，不直接处理支付。

---

## 6. 许可证、商标与合规

1. **AGPL-3.0**：修改后作为网络服务对外提供，通常需要向用户提供对应修改版本的源代码。不能通过"拆服务"假定规避。
2. **商标**：`TRADEMARKS.md` 明确商标不在 AGPL 授权范围内；必须替换名称、Logo、域名与视觉资产。
3. **第三方依赖与素材**：字体、地图瓦片、POI 图片、Unsplash 等均有各自授权，需要逐项登记。
4. **地图合规**：使用有资质的地图服务商，按供应商要求展示审图号、版权与标识；不自建公开地图数据库。
5. **数据出境**：地图、天气、模型、图片、邮件、监控分别登记；对含个人信息的链路做单独评估与告知。
6. **上线资质**：ICP/APP 备案、隐私政策、账号注销与数据导出、生成式 AI 相关要求，按实际形态逐项确认。

---

## 7. 12 周实施计划（文件级）

### 第 0 周：冻结范围与合规结论

- 产出：许可/商标/数据供应商书面结论；首批城市与评估集；数据流图。
- 验收：范围、成本上限、上线阻断项签字确认。

### 第 1–2 周：国内基础

- 配置高德 Key 与数字签名；生产设置 `TREK_PLACES_ENABLED=false`。
- 工作日：`maps/places-provider.selector.ts` 增加境内强制策略；`weather/` 抽 Provider 接口。
- 测试：5 个城市 POI、逆地理、驾车/步行路线、GCJ-02 回归。
- 验收：95% 标准地点查询成功；无未登记跨境请求。

### 第 3–4 周：规划域骨架

- 新增 `shared/src/ai-travel-plan/` schema、实体、迁移、module/controller/service。
- 接入 Maps / Route / Weather 白名单；完成解析与追问。
- 验收：30 组需求全部可解析或正确追问；无编造 POI。

### 第 5–6 周：草案与校验

- 实现排程器、预算区间、确定性校验器、版本化草案。
- 前端草案页、来源与警告展示、应用确认。
- 验收：应用前零写入；重复应用不产生重复数据。

### 第 7–8 周：协作与离线

- 对接分享、成员、投票、WebSocket；处理断网、重连、重复提交。
- 验收：双人同时编辑；离线恢复无重复。

### 第 9 周：安全与观测

- 限流、费用上限、脱敏、错误分类、链路日志、功能开关。
- 验收：可定位一次生成的模型、工具、数据来源调用。

### 第 10–12 周：真实内测

- 30–50 名目标用户；每周评审采用率、修改次数、失败原因、成本。
- 验收：达到成功标准后再评估支付、交易与独立 AI 服务。

---

## 8. 风险登记

| 风险 | 等级 | 缓解 |
|---|---|---|
| AGPL 源码义务与商业闭源冲突 | 高 | 法务评估；保留上游许可与 NOTICE；必要时谈商业授权 |
| 地图/天气/模型跨境数据 | 高 | Provider 白名单、默认关闭、出境清单与审计 |
| 高德配额与成本 | 中 | 缓存 POI/路线；按城市灰度；失败降级 |
| AI 生成事实错误 | 高 | 模型只做解析与文案；事实必须来自服务端工具；确定性校验 |
| 现有 Assistant 被误用为规划器 | 中 | 明确领域边界；`ai-travel-plan` 独立 API |
| 交易供给无法落地 | 中 | 首版只做外部跳转，不承诺站内闭环 |
| 用户复购不足 | 高 | 协作、游记、照片书、模板与提醒构成出行前后场景 |

---

## 9. 结论与建议

**建议基于 TREK 二次开发，但不做"中文版 TREK"。**

- 保留：行程、地点、日程、预算、预订、协作、离线、游记、MCP、插件。
- 改造：地图默认 Provider、天气抽象、跨境开关、品牌与入口。
- 新增：`ai-travel-plan` 领域、billing 领域、国内身份 Provider、运营与增长分析。
- 不做：第一阶段不做交易闭环、不做三端 App、不做内容社区、不重写后端。

**决策门槛**：在内测中验证"一句话生成 → 三次内改完 → 至少一名同行者加入 → 愿意付费"这一闭环，再投入交易与融资。

---

## 附录 A：关键文件索引

| 主题 | 文件 |
|---|---|
| 根工作区 | `package.json` |
| 后端依赖 | `server/package.json` |
| 根模块 | `server/src/nest/app.module.ts` |
| 行程写入 | `server/src/nest/trips/trip-writes.service.ts`、`trips.service.ts` |
| 行程 MCP | `server/src/nest/trips/trips.mcp.ts` |
| 地点 Provider | `server/src/nest/maps/places-provider.selector.ts`、`providers/amap.provider.ts` |
| 高德路线 | `server/src/nest/routing-relay/amap-directions.client.ts` |
| 坐标转换 | `shared/src/geo/gcj02.ts` |
| 天气 | `server/src/nest/weather/weather.impl.ts` |
| 预算分摊 | `server/src/nest/budget/budget-money.helpers.ts`、`budget-items.mcp.ts` |
| 实时协作 | `server/src/nest/realtime/realtime.gateway.ts` |
| AI 助手 | `server/src/nest/assistant/assistant.prompt.ts`、`assistant-agent.ts` |
| 模型连接 | `server/src/nest/ai-connections/` |
| MCP 传输 | `server/src/nest/mcp-transport/` |
| 插件运行时 | `server/src/nest/plugins/`、`plugin-sdk/` |
| 离线同步 | `client/src/sync/mutationQueue.ts`、`client/src/db/offlineDb.ts` |
| 中文语言 | `shared/src/i18n/languages.ts` |
| 环境变量 | `server/.env.example` |
| 许可证 | `LICENSE`、`NOTICE.md`、`TRADEMARKS.md` |
| 部署 | `Dockerfile`、`docker-compose.yml`、`charts/trek/` |

## 附录 B：核验方式

本报告基于以下静态检查：

1. 读取 `package.json`（根、client、server）确认版本、依赖与脚本。
2. 枚举 `server/src/nest/` 与 `client/src/` 目录，确认模块与页面边界。
3. 读取 `assistant.prompt.ts`、`places-provider.selector.ts`、`trips.mcp.ts`、`weather.impl.ts`、`supportedLanguages.ts`、`.env.example`、`TRADEMARKS.md`。
4. 统计 `server/src/db/entities/` 实体数量（168）。
5. 检查 `charts/`、`.github/workflows/`、`docker-compose.yml` 确认部署与 CI 能力。

未执行：动态压测、真实供应商联调、法律意见、计费成本核算。
