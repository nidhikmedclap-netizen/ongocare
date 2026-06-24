"use client";

import Image from "next/image";
import { mergeLogoBranding } from "@/lib/branding/defaults";

export default function BrandLogo({
  branding,
  className,
  imageClassName,
  priority = false,
  width,
  height,
}) {
  const b = mergeLogoBranding(branding);

  return (
    <span className={className}>
      <Image
        src={b.logoSrc}
        alt={b.logoAlt}
        width={width ?? b.logoWidth}
        height={height ?? b.logoHeight}
        priority={priority}
        className={imageClassName}
      />
    </span>
  );
}
