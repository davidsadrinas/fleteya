import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FleteYa marketplace de fletes en AMBA";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B132B 0%, #1C2541 50%, #3A506B 100%)",
          color: "#FFFFFF",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 38, opacity: 0.9 }}>FleteYa</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 12 }}>
          Tu flete,
          <br />
          simple y rápido.
        </div>
        <div style={{ fontSize: 30, marginTop: 26, maxWidth: 980, color: "#D1FAE5" }}>
          Marketplace de fletes en AMBA con asignación por cercanía y reputación.
        </div>
      </div>
    ),
    size
  );
}
