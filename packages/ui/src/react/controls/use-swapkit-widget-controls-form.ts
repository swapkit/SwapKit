"use client";

import { useEffect, useMemo, useRef } from "react";
import { createFormControl, useForm } from "react-hook-form";
import type { ControlsStoreFieldValues } from "../types";

const hasLocalStorageFormValues = typeof localStorage !== "undefined" && localStorage.getItem("formValues");

const defaultValues = hasLocalStorageFormValues
  ? JSON.parse(localStorage.getItem("formValues") || "")
  : {
      apiKey: "16621042-80db-41ed-83be-3f0349e0d703",
      apiUrl: "https://dev-api.swapkit.dev",
      apiUrlQuote: "",
      apiUrlSwap: "",
    };

const formControlInstance = createFormControl<ControlsStoreFieldValues>({ defaultValues });

export const useSwapKitWidgetControlsForm = () => {
  const previousValues = useRef<string>("");
  const form = useForm({ formControl: formControlInstance });

  const [apiUrl, apiKey, apiUrlQuote, apiUrlSwap] = form.watch(["apiUrl", "apiKey", "apiUrlQuote", "apiUrlSwap"]);

  const stringifiedValues = JSON.stringify({ apiKey, apiUrl, apiUrlQuote, apiUrlSwap });

  useEffect(() => {
    if (previousValues.current === stringifiedValues) return;

    localStorage.setItem("formValues", stringifiedValues);
    previousValues.current = stringifiedValues;
  }, [stringifiedValues]);

  return useMemo(
    () => ({ apiKey, apiUrl, apiUrlQuote, apiUrlSwap, control: form.control }),
    [apiUrl, apiKey, apiUrlQuote, apiUrlSwap, form.control],
  );
};
