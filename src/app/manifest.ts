import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clifford Moor Staff Note",
    short_name: "Staff Note",
    description: "Log extra jobs, walks, and notes at Clifford Moor Farm Pet Hotel.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe6",
    theme_color: "#1e4d38",
    lang: "en-GB",
  };
}
