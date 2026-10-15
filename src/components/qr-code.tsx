import { useEffect, useState } from "react";

export function QrCode({ value }: { value: string }) {
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancelled = false;
    void import("qrcode")
      .then((mod) =>
        mod.toString(value, {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#000000", light: "#ffffff" },
        }),
      )
      .then((markup) => {
        if (!cancelled && markup.trim().startsWith("<svg")) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg("");
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="rounded-2xl bg-white p-3">
      {svg ? (
        <div className="qr-frame" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="aspect-square w-full animate-pulse bg-neutral-200" aria-hidden="true" />
      )}
    </div>
  );
}
