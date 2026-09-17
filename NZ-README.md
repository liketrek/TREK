# 南岛，慢慢走 · Travel Planner

基于 TREK 仓库的 React 19、Vite、Leaflet 技术栈，为 NZ 目录中的旅行资料制作的独立中文旅行工作台。无须账号、数据库或地图 API Key。原有 TREK 应用保留；本工作台是单独入口，个人备注不会同步到 TREK 服务器。

## 打开

双击本目录的 `启动新西兰旅行.command`，或在此目录运行：

```bash
npm run dev:nz
```

浏览器打开 <http://127.0.0.1:5173/nz.html>。如果端口已占用，以终端实际输出端口为准。终端关闭后服务器停止，重新运行即可；备注保存在同一浏览器、同一网址的本地存储中。

## 已包含

- 2026 年 10 月 30 日至 11 月 9 日完整行程背景；D3–D10 每日时间线。
- 六天主要自驾路段的道路参考线，峡湾飞行和镇内活动用虚线表示。
- 全程地图、每天路线、地图缩放、地点聚合与定位；街道/地形底图切换。
- 当天地点搜索、Google Maps 地点搜索与多站导航链接。
- 八晚住宿候选、往返四段航班、原资料费用和十二项准备清单。
- 每日备注、清单自动保存；导出 JSON，保存行程和个人记录。
- 手机与桌面布局、地图加载失败提示。

## 信息边界

1. 每日里程和时间来自详细行程表；D9 使用 286 km，行程文档另有 306 km 的写法。汇总 1,276 km 仅包含资料明确列出的六天自驾，不包含镇内短途等未列里程。
2. 住宿是候选，费用沿用原资料，币种未明示；不是已确认预订或实时价格。
3. 观星、冰川徒步、跳伞集合点待订单确认。部分地点坐标为近似位置，在界面明确标注。
4. 路线使用 OSRM / OpenStreetMap 道路几何快照，非实时路况或精确全程导航。射击场等待确认活动可能不在道路参考线内。D5 经皇冠山脉与箭镇；D9 经 Cromwell、Omarama、Kurow。实际驾车请使用导航并确认地址。
5. 航班时间沿用信息汇总，按当地时间展示；尚未向航空公司实时核验。日落和活动场次也需按预订调整。
6. 地图底图由 OpenStreetMap 或 Esri 联网加载。路线、行程数据随构建打包；无后台账户和跨设备同步。导出 JSON 是备份文件，目前不提供导入界面。

## 文件和更新

- `client/src/nz/source-data.json`：从两个 Excel 文件提取的原文。
- `client/src/nz/data.ts`：经整理的时间线、地点、资料链接。
- `client/src/nz/road-routes.json`：主要公路路线快照。
- `scripts/nz/import_sources.py`：只读提取源工作簿，需要 Python 的 openpyxl。
- `scripts/nz/fetch_routes.py`：重新获取公开道路几何，需要联网及 curl。

源工作簿更新后，运行导入脚本只会更新原始数据；整理后的时间线需要同步修改 `data.ts` 并运行测试。原始 Word、Excel、CSV 文件均未修改。

## 构建与检查

```bash
npm run build:nz
npm run preview:nz
npm run test --workspace=client -- src/nz/data.test.ts
```

构建输出为 `client/dist-nz/`，预览地址通常为 <http://127.0.0.1:4173/nz.html>。

## 推送到自己的 GitHub 并发布网页

当前仓库的 `origin` 是 `liketrek/TREK`，不能把个人行程直接推到上游。先在 GitHub 上 Fork 此仓库到自己的账号，再从项目根目录运行（将 `YOUR_USERNAME` 改成自己的用户名）：

```bash
git switch -c nz-travel
git add .github/workflows/nz-pages.yml NZ-README.md client/.gitignore client/package.json client/nz.html client/src/nz client/vite.nz.config.ts package.json scripts/nz 启动新西兰旅行.command
git diff --cached --check
git commit -m "feat(nz): add South Island travel planner"
git remote add mine git@github.com:YOUR_USERNAME/TREK.git
git push -u mine nz-travel
```

在自己的 Fork 网页上把 `nz-travel` 合并到自己的 `main`。进入该仓库 **Settings → Pages → Build and deployment → Source**，选 **GitHub Actions**。工作流会在 `main` 包含相关文件变更时构建并发布；也可在 **Actions → Publish NZ Travel Planner → Run workflow** 手动运行。完成后网址为 `https://YOUR_USERNAME.github.io/TREK/`（仓库改名时使用实际仓库名）。

静态网页会公开显示路线、航班、住宿候选和已记录费用；即使来源仓库为私有，普通 GitHub Pages 也可能是公开网站。先检查 `client/src/nz/` 中要公开的内容。当前仅提交整理后的资料，NZ 目录中的原始 Word、Excel、CSV 文件仍在仓库外。个人备注与清单保存在访问者自己的浏览器，未由 Pages 同步。
