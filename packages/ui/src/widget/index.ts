import type { AssetValue } from "@swapkit/core";

type WidgetOptions = {
  apiKey: string;
  swap?: {
    input: string | AssetValue;
    output: string | AssetValue;
    amount?: string;
  };
  theme: {
    logoUrl: string;
  };
};

export function createWidgetUrl({ apiKey, swap, theme: { logoUrl } }: WidgetOptions) {
  if (!apiKey) throw new Error("apiKey is required");

  const swapParams = swap ? `&input=${swap.input.toString()}&output=${swap.output.toString()}` : "";
  const amountParams = swap?.amount ? `&amount=${swap.amount}` : "";
  const logoParams = logoUrl ? `&logo=${logoUrl}` : "";

  const param = `apiKey=${apiKey}${swapParams}${amountParams}${logoParams}`;

  return `https://widget.swapkit.io/swap?${param}`;
}

let widget: HTMLIFrameElement | null = null;

export function injectWidget(options: WidgetOptions, container?: string | HTMLElement) {
  const containerElement = container
    ? typeof container === "string"
      ? document.getElementById(container)
      : container
    : document.body;

  if (!containerElement) throw new Error("Container not found");

  const widgetUrl = createWidgetUrl(options);

  widget = document.createElement("iframe");
  widget.src = widgetUrl;
  widget.width = "100%";
  widget.height = "100%";
  widget.style.border = "none";
  widget.style.overflow = "hidden";
  widget.style.width = "100%";
  widget.style.height = "100%";
  widget.style.borderRadius = "16px";
  widget.style.boxShadow = "0 0 10px 0 rgba(0, 0, 0, 0.1)";
  widget.style.background = "transparent";
  widget.style.zIndex = "1000";

  containerElement.appendChild(widget);

  return widget;
}

export function removeWidget() {
  if (widget?.parentElement) {
    widget.parentElement.removeChild(widget);
  }
}
