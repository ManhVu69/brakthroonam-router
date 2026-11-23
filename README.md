# 🚀 Brakthroonam Router PRO (Local Gateway Engine v1.0.0)

> **Hạ tầng định tuyến API, tự động cân bằng tải & xoay tua đa tài khoản Google Gemini, OpenAI Codex & Anthropic Claude cho các Coding Assistants & IDEs.**

[![npm version](https://img.shields.io/npm/v/brakthroonam-router.svg)](https://www.npmjs.com/package/brakthroonam-router)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-brightgreen.svg)]()

---

## ⚡ Tính Năng Cốt Lõi (Key Features)

- **🔄 Multi-Account Pool & Auto-Rotation:** Xoay tua linh hoạt giữa nhiều tài khoản (Google OAuth, OpenAI Session/Access Token, Claude Direct API) theo chiến lược Round-Robin hoặc Tiered Priority.
- **🛡️ Anti-429 Shield & Fallback:** Tự động phát hiện lỗi cạn hạn ngạch (Rate Limit 429 / Quota Exhaustion) và trượt mượt mà sang tài khoản tiếp theo mà không làm đứt gãy luồng streaming code.
- **⚡ Tích hợp 1-Click Cho Coding IDEs:**
  - **OpenAI Codex & ChatGPT Desktop:** Tự động cấu hình `config.toml` và `auth.json` để trỏ về Gateway nội bộ.
  - **Google Antigravity IDE:** Đánh chặn traffic SSL an toàn qua MITM Proxy cục bộ, hoán đổi Bearer token ngầm chống gián đoạn.
  - **Cursor, Claude Code, Cline / Roo Code, Windsurf:** Cung cấp endpoint chuẩn OpenAI-compatible `http://localhost:20129/v1`.
- **🌐 Web Dashboard Quản Trị Trực Quan:** Quản lý tài khoản, ma trận Model, theo dõi Quota Tracker và lịch sử gọi API theo thời gian thực tại `http://localhost:20129`.
- **🔒 100% On-Device Privacy:** Xử lý và lưu trữ thông tin cấu hình hoàn toàn trên máy tính cá nhân của bạn, không gửi dữ liệu qua bất kỳ cloud server trung gian nào.

---

## 📦 Cài Đặt & Sử Dụng Nhanh (Quickstart)

### Cách 1: Chạy trực tiếp không cần cài đặt (Khuyên dùng)
```bash
npx brakthroonam-router
```

### Cách 2: Cài đặt toàn cục (Global CLI)
```bash
npm install -g brakthroonam-router
brakthroonam-router
```

Sau khi khởi động, trình duyệt sẽ tự động mở trang quản trị:
- **Web Dashboard:** `http://localhost:20129`
- **OpenAI-Compatible API Base URL:** `http://localhost:20129/v1`

---

## 🛠️ Tùy Chọn Dòng Lệnh (CLI Options)

```bash
brakthroonam-router [options]

Tùy chọn:
  -p, --port <port>   Cổng chạy dịch vụ (Mặc định: 20129)
  -H, --host <host>   Địa chỉ host (Mặc định: 0.0.0.0)
  -n, --no-browser    Không tự động bật trình duyệt khi khởi động
  -h, --help          Hiển thị thông tin trợ giúp
```

Ví dụ chạy trên cổng khác:
```bash
brakthroonam-router --port 8080 --no-browser
```

---

## 🔌 Cấu Hình Cho Client & IDE

| Client / Tool | Base URL | API Key | Model gợi ý |
| :--- | :--- | :--- | :--- |
| **Cursor** | `http://localhost:20129/v1` | `dummy-key` | `gemini-2.5-pro`, `gpt-4o`, `claude-3-7-sonnet` |
| **Claude Code** | `http://localhost:20129/v1` | `dummy-key` | Tuân theo alias map trong Dashboard |
| **Cline / Roo Code** | `http://localhost:20129/v1` | `dummy-key` | OpenAI Compatible |
| **Google Antigravity** | Kích hoạt 1-Click trên Web UI | Tự động | Tự động xoay tua OAuth |

---

## 📜 Giấy Phép (License)

Phát hành dưới giấy phép [ISC License](LICENSE).
Tự do sử dụng, tùy chỉnh và triển khai cục bộ cho mục đích cá nhân và nhóm.
