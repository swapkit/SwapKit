import { useEffect, useMemo, useRef } from "react";
import { createFormControl, useWatch } from "react-hook-form";
import { create } from "zustand";

export type ControlsStoreFieldValues = { apiUrl: string; apiKey: string; apiUrlQuote: string; apiUrlSwap: string };

const hasLocalStorageFormValues = typeof localStorage !== "undefined" && localStorage.getItem("formValues");

const defaultValues = hasLocalStorageFormValues
  ? JSON.parse(localStorage.getItem("formValues") || "")
  : {
      apiKey: "16621042-80db-41ed-83be-3f0349e0d703",
      apiUrl: "https://dev-api.swapkit.dev",
      apiUrlQuote: "",
      apiUrlSwap: "",
    };

const useControlsStore = create(() => ({ form: createFormControl<ControlsStoreFieldValues>({ defaultValues }) }));

export const useSwapKitWidgetControlsForm = () => {
  const _form = useControlsStore((state) => state.form);
  const previousValues = useRef<string>("");

  const { apiUrl, apiKey, apiUrlQuote, apiUrlSwap } = useWatch({ control: _form.control }) ?? {};

  const stringifiedValues = JSON.stringify({ apiKey, apiUrl, apiUrlQuote, apiUrlSwap });

  useEffect(() => {
    if (previousValues.current === stringifiedValues) return;

    localStorage.setItem("formValues", stringifiedValues);
    previousValues.current = stringifiedValues;
  }, [stringifiedValues]);

  return useMemo(
    () => ({ apiKey, apiUrl, apiUrlQuote, apiUrlSwap, control: _form.control }),
    [apiUrl, apiKey, apiUrlQuote, apiUrlSwap, _form.control],
  );
};
