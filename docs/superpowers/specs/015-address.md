# 地址管理 — 功能需求规格

> **话题标签:** `015-address`
> **上次更新:** 2026-07-05

## 业务定位

用户保存古城内的地址（客栈/店铺），用于便民服务下单时快速填写地址。

## 页面清单

| 端 | 页面 | 路由 | 说明 |
|---|---|---|---|
| C | AddressListPage | `/c/addresses` | 地址列表 |
| C | AddressEditPage | `/c/addresses/edit/:id` | 地址编辑/新增 |

**约束：** 无桌面端管理，地址数据本地持久化（localStorage）。

## 本 Demo 的范围

- ✅ **C 端**: AddressListPage（地址列表）、AddressEditPage（新增/编辑地址）
- ✅ **Store**: address-store（地址 CRUD）
- ⚠️ **localStorage 持久化**: 无后端数据库
- ❌ **无桌面端管理**: 无后台地址管理页面
