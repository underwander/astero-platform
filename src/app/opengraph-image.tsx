import { ImageResponse } from "next/og";

export const alt = "Юридическая помощь по финансовым спорам";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "linear-gradient(135deg,#07111f,#10263f)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", color: "#dcc18e", fontSize: 24, letterSpacing: 4, textTransform: "uppercase" }}>
        Правовой анализ
      </div>
      <div style={{ display: "flex", maxWidth: 980, fontSize: 68, lineHeight: 1.08, fontWeight: 700 }}>
        Юридическая помощь по финансовым спорам
      </div>
      <div style={{ display: "flex", color: "rgba(255,255,255,.65)", fontSize: 26 }}>
        Брокеры · Банки · Платёжные и криптовалютные сервисы
      </div>
    </div>,
    size,
  );
}
