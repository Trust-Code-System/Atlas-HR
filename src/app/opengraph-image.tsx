import { atlasBrandOgImage, ogAlt, ogContentType, ogSize } from "@/lib/og-home";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return atlasBrandOgImage();
}
