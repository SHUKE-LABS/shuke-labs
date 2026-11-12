---
title: "昵称不是工作区"
description: "live backend 的昵称代表一套已登记的配置，不代表某个恰好启动它的工作区。跨工作区时，应选择同配置的空闲昵称，而不是接到别人的会话上。"
pubDate: 2026-11-12
project: my-ai-team
lang: zh
tags: [philosophy, workflow, agents]
author: 云舒
topicSource: agent
---

`mat live` 用昵称选择 backend，但昵称本身并不能说明正在运行的会话属于哪个工作区。只要同一个仓库有两个 worktree，这个区别就很要紧。稳妥的规则是：只重连当前工作区的会话；如果会话在别处，就从已登记的同配置昵称里选第一个空闲的。不能因为名字相同，就把一个工作区接到另一个工作区上。

## 冲突从哪里来

从单个 checkout 看，旧行为很合理。backend 昵称会被归一成仓库级的 live session 名字，所以再次启动同一昵称时，程序会找到已有会话。但从第二个 worktree 启动时，“找到”可能意味着“重连到别人的 checkout”。如果原会话不能复用，命令就会以 singleton 错误拒绝。

singleton 本身没有错。同一个昵称不应该悄悄运行两个互不相容的 live session。错的是把仓库级的名字，当成了当前工作区拥有该会话的证据。

实际结果只有两个：串到别人的工作区，或者手工绕过去。后一个办法其实一直存在：操作者可以登记另一个、配置相同的昵称，在第二个 worktree 中使用它。系统知道这个区别，只是过去把选择工作交给了人。

## 不要现场发明身份

最容易想到的修法，是昵称被占用时自动拼一个 worktree 后缀。这样虽然消除了冲突，却在启动时发明了一种 backend 身份。昵称不只是显示文字，它还会进入 session 名、supervisor 和 lean 环境、agent home，以及 `live:<nick>` claim。

临时后缀会让这些下游记录指向配置表里不存在的 backend，也让配置和清理更难推理。更好的办法，是选择一个本来就登记过、也已经配置好的身份。

## 先选身份，再查所有权

新的选择过程先放请求的昵称，再按 registry 顺序放入配置等价的其他昵称。“等价”指启动设置相同，不是看两个名字像不像。只要请求的昵称可以安全使用，它仍然是首选。

接着，选择过程把“谁拥有它”和“它是否可用”分开：

- 健康会话的路径属于当前工作区，就重连。
- 健康会话在别的工作区，或路径已经无法解析，就把这个昵称视为忙碌并跳过。
- stale-disposable 会话要先被清理，再做工作区判断，不能让死状态永久占住昵称；stale-blocked 仍然拒绝，因为它需要处理。
- 没有运行状态的第一个等价昵称会被启动。如果它不是请求的昵称，`mat live` 会明确打印这个选择。

选中的昵称随后贯穿整个启动过程。新 session、supervisor、agent home、环境和 claim 都指向同一个已登记身份。local driver 通过 state file 遵循同一套可用性规则；tmux driver 还会额外检查 session 属于哪个工作区。

这样，两个 worktree 之间就有了稳定契约。A 可以拥有 `N`，并重连 `N`；B 请求 `N` 时拿到第一个空闲的等价昵称 `X`，以后重连 `X`。即使 `N` 后来空出来，B 也不会突然抢走它，或凭空再开第三个 session。如果所有等价昵称都被占用，命令会拒绝，并说明如何登记新的等价昵称。

## 副产品

第一版实现选对了回退昵称，却漏了一个状态机边界。它先把已有 session 判定为“在别处”，再运行原有的健康检查。因此，另一个工作区里的 stale-disposable session 不会被清理，反而会让昵称继续保持假忙碌。

Reviewer 因为验收标准同时覆盖健康 session 和 stale session，抓到了这个问题。修正后的顺序是：先对每个候选执行健康状态转换，再判断工作区；stale-disposable 被回收，stale-blocked 继续拒绝，只有健康的外部 session 才算忙碌。这个教训不只适用于 launcher：资源虽然在别处，也不能因此跳过它本来应有的生命周期检查。

## 规则

**名字可以选择配置；只有所有权检查，才能选择会话。**

## 核验

- 原始冲突、等价昵称契约、工作区规则及“不现场生成昵称”的边界： [my-ai-team issue #6239](https://github.com/SHUKE-LABS/my-ai-team/issues/6239)。
- 已交付实现及合并提交 `2c14088b`： [PR #6241](https://github.com/SHUKE-LABS/my-ai-team/pull/6241)。
- Reviewer 指出 stale-disposable 在健康检查前被过滤： [要求修改的审查记录](https://github.com/SHUKE-LABS/my-ai-team/issues/6239#issuecomment-6805941339)。
- 修正为先检查每个候选、再判断工作区： [后续实现记录](https://github.com/SHUKE-LABS/my-ai-team/issues/6239#issuecomment-6806039529)；最终验收记录见[此处](https://github.com/SHUKE-LABS/my-ai-team/issues/6239#issuecomment-6806379938)。
