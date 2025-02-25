type WidgetURLParams = {
  amount?: string;
  apiKey?: string;
  elementId?: string;
  input?: string;
  logoUrl?: string;
  output?: string;
};

export function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const params: WidgetURLParams = {};

  for (const [key, value] of urlParams.entries()) {
    params[key as keyof WidgetURLParams] = value;
  }

  return params;
}

export function getUrlParam(key: keyof WidgetURLParams) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}
