import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1e4d38",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 96,
        }}
      >
        <div style={{ display: "flex", position: "relative", width: 280, height: 280 }}>
          <div
            style={{
              position: "absolute",
              left: 78,
              top: 128,
              width: 124,
              height: 96,
              borderRadius: 70,
              background: "#f4efe6",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 78,
              width: 52,
              height: 64,
              borderRadius: 40,
              background: "#f4efe6",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 86,
              top: 36,
              width: 52,
              height: 68,
              borderRadius: 40,
              background: "#f4efe6",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 148,
              top: 36,
              width: 52,
              height: 68,
              borderRadius: 40,
              background: "#f4efe6",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 204,
              top: 78,
              width: 52,
              height: 64,
              borderRadius: 40,
              background: "#f4efe6",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
