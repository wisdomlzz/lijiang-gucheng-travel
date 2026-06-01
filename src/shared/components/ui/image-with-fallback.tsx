import { useState } from "react";

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);

  if (didError) {
    return (
      <div
        className={`inline-flex items-center justify-center bg-gray-100 text-muted-foreground text-xs ${props.className ?? ""}`}
        style={props.style}
      >
        加载失败
      </div>
    );
  }

  return <img {...props} onError={() => setDidError(true)} />;
}
