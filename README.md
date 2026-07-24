# React + Vite

## Kết nối biểu mẫu RSVP với Google Sheets

1. Tạo một Google Sheet mới, mở **Extensions → Apps Script**.
2. Dán nội dung file `google-apps-script/Code.gs` vào Apps Script.
3. Chọn **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Sao chép URL kết thúc bằng `/exec`.
5. Tạo file `.env` từ `.env.example` và thay URL vào `VITE_RSVP_ENDPOINT`.
6. Khởi động lại ứng dụng hoặc build lại website.

Phản hồi sẽ được ghi vào trang tính `RSVP` với các cột: số thứ tự, họ tên,
tham dự lễ tốt nghiệp, tham dự tiệc ăn mừng, ghi chú và thời gian gửi.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
