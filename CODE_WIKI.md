# Code Wiki：聚会 AA 分钱计算器

本文档基于仓库当前代码生成，目标是帮助新成员快速理解整体架构、模块职责、关键函数与数据结构、依赖关系以及运行/部署方式。

## 1. 项目概览

- **项目类型**：Cloudflare Pages 上的纯静态站点（无打包构建步骤）
- **核心功能**：输入参与者与多种费用类型，计算每人应付总额，并在浏览器本地自动保存数据
- **核心代码位置**：单文件前端应用 [index.html](file:///workspace/public/index.html)

### 1.1 运行时架构（高层）

```mermaid
flowchart LR
  U[用户] --> B[浏览器]
  P[Cloudflare Pages / 本地 wrangler pages dev] -->|静态资源| B
  B -->|CDN| R[React 18 UMD]
  B -->|CDN| D[ReactDOM 18 UMD]
  B -->|CDN| T[Tailwind CDN]
  B -->|CDN| BBL[@babel/standalone]
  B -->|localStorage| LS[(aa-billing-data)]
  B --> APP[AABillCalculator 组件<br/>UI + 状态 + 计算]
```

要点：
- UI/逻辑全部在浏览器端执行；服务端仅负责静态资源分发。
- JSX 通过 `@babel/standalone` 在浏览器端即时编译（`<script type="text/babel">`）。
- 状态持久化依赖 `localStorage`（同域、同浏览器）。

## 2. 仓库结构

```
/workspace
  public/
    index.html            # 单文件 React 应用（JSX + Tailwind + 业务逻辑）
  test/
    index.spec.js         # Workers 风格测试样例（当前缺少被测 worker 入口）
  package.json            # 脚本与开发依赖
  vitest.config.js        # vitest + cloudflare workers pool 配置
  wrangler.json           # Cloudflare Pages 配置（输出目录 public）
  package-lock.json       # 依赖锁定
  .prettierrc/.editorconfig/.vscode/settings.json 等
```

## 3. 核心模块职责

### 3.1 `public/index.html`（单文件前端应用）

位置：[index.html](file:///workspace/public/index.html)

职责拆解：
- **依赖加载**（CDN）：React/ReactDOM/Babel/Tailwind（见 [index.html:L7-L10](file:///workspace/public/index.html#L7-L10)）
- **持久化层**：封装 `localStorage` 读写（见 [loadFromStorage](file:///workspace/public/index.html#L23-L31)、[saveToStorage](file:///workspace/public/index.html#L33-L41)）
- **UI 组件**：主组件 `AABillCalculator` + 一组 SVG 图标组件（见 [index.html:L43-L91](file:///workspace/public/index.html#L43-L91)）
- **状态管理**：通过 `useState/useEffect` 管理人、账单列表等（见 [index.html:L93-L107](file:///workspace/public/index.html#L93-L107)）
- **费用录入**：四种费用类型的增删改（见后文“关键函数”）
- **结算计算**：通过 `useMemo` 计算每人应付拆分与总额（见 [index.html:L270-L311](file:///workspace/public/index.html#L270-L311)）
- **渲染入口**：`ReactDOM.render(...)`（见 [index.html:L809-L811](file:///workspace/public/index.html#L809-L811)）

### 3.2 `wrangler.json`（Pages 配置）

位置：[wrangler.json](file:///workspace/wrangler.json)

- `pages_build_output_dir: "public"`：部署/本地预览时将 `public/` 作为站点输出目录

### 3.3 `vitest.config.js` + `test/index.spec.js`（测试）

位置：[vitest.config.js](file:///workspace/vitest.config.js)、[index.spec.js](file:///workspace/test/index.spec.js)

- 采用 `@cloudflare/vitest-pool-workers` 的 Workers 测试池（见 [vitest.config.js:L1-L11](file:///workspace/vitest.config.js#L1-L11)）
- 测试用例是 Workers “Hello World” 模板，但当前仓库缺少 `../src` 的 worker 入口实现（见 [index.spec.js:L1-L4](file:///workspace/test/index.spec.js#L1-L4)）

## 4. 数据模型与结算逻辑

### 4.1 本地存储结构

- Key：`aa-billing-data`（见 [index.html:L21-L41](file:///workspace/public/index.html#L21-L41)）
- Value：JSON 对象（由 `useEffect` 自动保存，见 [index.html:L103-L107](file:///workspace/public/index.html#L103-L107)）

字段含义（与状态一一对应）：
- `people: string[]`
- `sharedExpenses: { description: string; amount: number; shares: Record<string, number> }[]`
- `partialExpenses: { description: string; amount: number; participants: { name: string; shares: number }[] }[]`
- `individualExpenses: { person: string; description: string; amount: number }[]`
- `manualExpenses: { description: string; amounts: Record<string, number> }[]`

### 4.2 费用类型定义

- **全员共同费用（sharedExpenses）**：每条费用对所有人都生效，但允许通过 `shares` 给不同人设置“份数权重”
- **部分参与者费用（partialExpenses）**：只对参与者列表生效，同时也支持“份数权重”
- **个人费用（individualExpenses）**：只对指定 `person` 生效
- **手动分配费用（manualExpenses）**：不做自动计算，直接输入每人金额并汇总

### 4.3 结算公式（核心）

位置：[index.html:L270-L311](file:///workspace/public/index.html#L270-L311)

对每个人 `person`：
- `sharedAmount`：对所有 sharedExpense 求和  
  - `totalShares = sum(exp.shares[*])`  
  - `personShares = exp.shares[person]`  
  - `personPay = exp.amount * personShares / totalShares`
- `partialAmount`：对所有 partialExpense 求和  
  - 仅当 `person` 在 `participants` 中时参与分摊  
  - `totalShares = sum(participants[*].shares)`  
  - `personPay = exp.amount * personEntry.shares / totalShares`
- `individualAmount`：对 `exp.person === person` 的个人费用金额求和
- `manualAmount`：对所有 manualExpense 的 `amounts[person]` 求和
- `totalAmount = sharedAmount + partialAmount + individualAmount + manualAmount`

同时计算总费用：
- `totalAmount = sum(results[*].totalAmount)`（见 [index.html:L308-L311](file:///workspace/public/index.html#L308-L311)）

## 5. 关键组件与函数说明

> 本项目没有传统意义上的“类（class）”；核心是函数式 React 组件与组件内的业务函数。

### 5.1 持久化函数

- [loadFromStorage](file:///workspace/public/index.html#L23-L31)
  - **职责**：从 `localStorage` 读取并反序列化保存的数据
  - **返回**：成功则返回对象，否则返回 `null`
- [saveToStorage](file:///workspace/public/index.html#L33-L41)
  - **职责**：将当前状态序列化写入 `localStorage`
  - **返回**：写入成功返回 `true`，失败返回 `false`，并在 UI 顶部提示（见 [index.html:L315-L320](file:///workspace/public/index.html#L315-L320)）

### 5.2 主组件：`AABillCalculator`

位置：[AABillCalculator](file:///workspace/public/index.html#L93-L807)

关键状态（节选）：
- `people`：参与者列表（见 [index.html:L96-L97](file:///workspace/public/index.html#L96-L97)）
- `sharedExpenses/partialExpenses/individualExpenses/manualExpenses`：四类费用列表（见 [index.html:L98-L101](file:///workspace/public/index.html#L98-L101)）
- `storageError`：本地存储失败标记（见 [index.html:L95-L107](file:///workspace/public/index.html#L95-L107)）

关键业务函数（按域分组）：
- 参与者
  - [addPerson](file:///workspace/public/index.html#L118-L133)：新增参与者，并同步补齐已有账单的 `shares/amounts` 默认项
  - [removePerson](file:///workspace/public/index.html#L135-L153)：删除参与者，并清理所有费用结构中对应字段
- 全员共同费用
  - [addSharedExpense](file:///workspace/public/index.html#L155-L160)
  - [updateSharedExpense](file:///workspace/public/index.html#L162-L167)
  - [removeSharedExpense](file:///workspace/public/index.html#L169-L172)
  - [updateSharedExpenseShares](file:///workspace/public/index.html#L174-L179)
- 部分参与者费用
  - [addPartialExpense](file:///workspace/public/index.html#L181-L188)
  - [updatePartialExpense](file:///workspace/public/index.html#L190-L195)
  - [togglePartialParticipant](file:///workspace/public/index.html#L197-L210)
  - [updatePartialParticipantShares](file:///workspace/public/index.html#L212-L220)
  - [removePartialExpense](file:///workspace/public/index.html#L222-L225)
- 个人费用
  - [addIndividualExpense](file:///workspace/public/index.html#L227-L230)
  - [updateIndividualExpense](file:///workspace/public/index.html#L232-L237)
  - [removeIndividualExpense](file:///workspace/public/index.html#L239-L242)
- 手动分配费用
  - [addManualExpense](file:///workspace/public/index.html#L244-L249)
  - [updateManualExpenseDescription](file:///workspace/public/index.html#L251-L256)
  - [updateManualExpenseAmount](file:///workspace/public/index.html#L258-L263)
  - [removeManualExpense](file:///workspace/public/index.html#L265-L268)
- 清空所有账单
  - [clearAllBills](file:///workspace/public/index.html#L109-L116)

### 5.3 UI 分区（帮助定位页面逻辑）

位置：主 JSX 渲染区 [index.html:L313-L806](file:///workspace/public/index.html#L313-L806)

- 左侧：参与者管理 + 四类费用录入
  - 参与者管理（见 [index.html:L340-L378](file:///workspace/public/index.html#L340-L378)）
  - 全员共同费用（见 [index.html:L380-L461](file:///workspace/public/index.html#L380-L461)）
  - 部分参与者费用（见 [index.html:L463-L554](file:///workspace/public/index.html#L463-L554)）
  - 个人费用（见 [index.html:L556-L606](file:///workspace/public/index.html#L556-L606)）
  - 手动分配费用（见 [index.html:L608-L668](file:///workspace/public/index.html#L608-L668)）
- 右侧：分摊结果 + 费用明细（见 [index.html:L671-L802](file:///workspace/public/index.html#L671-L802)）

## 6. 依赖关系

### 6.1 运行时依赖（浏览器端 CDN）

见 [index.html:L7-L10](file:///workspace/public/index.html#L7-L10)

- `react@18`（UMD）
- `react-dom@18`（UMD）
- `@babel/standalone`（浏览器端即时编译 JSX）
- `tailwindcss`（CDN）

### 6.2 开发/部署依赖（npm）

见 [package.json](file:///workspace/package.json)

- `wrangler`：本地开发与部署到 Cloudflare Pages
- `vitest`：测试框架
- `@cloudflare/vitest-pool-workers`：Workers 测试池

### 6.3 内部依赖/调用链

核心调用链（页面加载后）：
1. `loadFromStorage()` 初始化默认状态（见 [index.html:L93-L101](file:///workspace/public/index.html#L93-L101)）
2. 用户操作触发各类 `add/update/remove`，更新 React state
3. `useEffect` 在 state 变化时自动 `saveToStorage(...)`（见 [index.html:L103-L107](file:///workspace/public/index.html#L103-L107)）
4. `useMemo` 计算 `results/totalAmount`，驱动右侧结算展示（见 [index.html:L270-L311](file:///workspace/public/index.html#L270-L311)）

## 7. 运行、部署与测试

### 7.1 本地运行（开发预览）

依赖：Node.js + npm

```bash
npm ci
npm run dev -- --ip 0.0.0.0 --port 8787
```

仓库脚本定义见 [package.json:L5-L11](file:///workspace/package.json#L5-L11)。本地服务由 `wrangler pages dev public` 启动。

### 7.2 部署到 Cloudflare Pages

```bash
npm ci
npm run deploy
```

部署输出目录由 [wrangler.json](file:///workspace/wrangler.json) 中 `pages_build_output_dir` 指定为 `public`。

### 7.3 测试（当前状态）

```bash
npm test
```

当前测试无法运行，原因：
- `vitest.config.js` 指向不存在的 `./wrangler.jsonc`（见 [vitest.config.js:L7](file:///workspace/vitest.config.js#L7-L8)）
- `test/index.spec.js` 依赖的 `../src` worker 入口不存在（见 [index.spec.js:L1-L4](file:///workspace/test/index.spec.js#L1-L4)）

## 8. 已知问题与改进建议（面向代码维护）

- **浏览器端 Babel 编译**：`@babel/standalone` 会增加首屏体积与运行开销；如需规模化迭代，建议迁移到标准前端构建（Vite/webpack 等）并将代码拆分到 `src/`。
- **测试/Workers 配置不一致**：当前测试配置与仓库代码形态不匹配；若需要 Workers 功能与测试，应补齐 `src/` worker 入口并统一 `wrangler` 配置文件名。
- **单文件可维护性**：业务逻辑与 UI 紧耦合在一个 HTML 文件中；建议按“数据模型/计算/组件/存储”分层拆分，降低回归风险。

