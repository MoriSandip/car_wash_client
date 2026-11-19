import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

const resolveImageSource = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const source = resolveImageSource(item);
      if (source) return source;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const image = value as {
      url?: unknown;
      secure_url?: unknown;
      imageUrl?: unknown;
      src?: unknown;
    };
    return resolveImageSource(
      image.url ?? image.secure_url ?? image.imageUrl ?? image.src,
    );
  }
  return "";
};

type ListImageProps = {
  source: unknown;
  alt: string;
  className?: string;
};

const ListImage = ({ source, alt, className }: ListImageProps) => {
  const [failedSource, setFailedSource] = useState("");
  const src = resolveImageSource(source);

  if (!src || failedSource === src) {
    return (
      <span
        aria-label={alt}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400",
          className,
        )}
      >
        <ImageOff className="h-5 w-5" aria-hidden="true" />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSource(src)}
      className={cn(
        "inline-block shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover",
        className,
      )}
    />
  );
};

export default ListImage;
