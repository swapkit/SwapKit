"use client";

import { SKConfig } from "@swapkit/helpers";
import { useEffect, useMemo, useRef } from "react";
import { createFormControl, useForm } from "react-hook-form";
import type { ControlsStoreFieldValues } from "../types";

const defaultApiUrl = SKConfig.getState().envs.devApiUrl;

const defaultValues = {
  apiKey: "16621042-80db-41ed-83be-3f0349e0d703",
  apiUrl: defaultApiUrl,
  apiUrlQuote: `${defaultApiUrl}/v3/quote`,
  apiUrlSwap: `${defaultApiUrl}/v3/swap`,
};

const formControlInstance = createFormControl<ControlsStoreFieldValues>({ defaultValues });

export const useSwapKitWidgetControlsForm = () => {
  const previousValues = useRef<string>("");
  const form = useForm({ formControl: formControlInstance });

  const [apiUrl, apiKey, apiUrlQuote, apiUrlSwap] = form.watch(["apiUrl", "apiKey", "apiUrlQuote", "apiUrlSwap"]);

  const stringifiedValues = JSON.stringify({ apiKey, apiUrl, apiUrlQuote, apiUrlSwap });

  useEffect(() => {
    const persistedValues = localStorage.getItem("formValues");

    if (!persistedValues) return;

    try {
      const parsed = JSON.parse(persistedValues);

      form.reset(parsed, { keepDefaultValues: true });
    } catch {
      localStorage.removeItem("formValues");
    }
  }, [form]);

  useEffect(() => {
    if (!form.formState.isReady) return;
    if (previousValues.current === stringifiedValues) return;

    localStorage.setItem("formValues", stringifiedValues);

    previousValues.current = stringifiedValues;
  }, [stringifiedValues, form.formState.isReady]);

  return useMemo(
    () => ({ apiKey, apiUrl, apiUrlQuote, apiUrlSwap, form }),
    [apiUrl, apiKey, apiUrlQuote, apiUrlSwap, form],
  );
};
