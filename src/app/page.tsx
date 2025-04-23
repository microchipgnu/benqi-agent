"use client";
import { RedocStandalone } from "redoc";

export default function Home() {
  return (
    <RedocStandalone
      specUrl="/.well-known/ai-plugin.json"
      options={{
        theme: {
          colors: {
            primary: { main: "#0EA47A" },
            text: { primary: "#000000" },
          },
        },
        scrollYOffset: 60,
        hideDownloadButton: true,
      }}
    />
  );
}
