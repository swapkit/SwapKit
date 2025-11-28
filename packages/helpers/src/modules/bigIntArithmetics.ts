import { match } from "ts-pattern";
import type { SwapKitNumber } from "./swapKitNumber";

type NumberPrimitivesType = { bigint: bigint; number: number; string: string };
export type NumberPrimitives = bigint | number | string;
type InitialisationValueType = NumberPrimitives | BigIntArithmetics | SwapKitNumber;

type SKBigIntParams = InitialisationValueType | { decimal?: number; value: number | string };
type AllowedNumberTypes = "bigint" | "number" | "string";

const DEFAULT_DECIMAL = 8;
const PRECISION_BUFFER = 10;

export function formatBigIntToSafeValue({
  value,
  bigIntDecimal = DEFAULT_DECIMAL,
  decimal = DEFAULT_DECIMAL,
}: {
  value: bigint;
  bigIntDecimal?: number;
  decimal?: number;
}) {
  if (decimal === 0) return value.toString();

  const isNegative = value < 0n;
  let valueString = value.toString().substring(isNegative ? 1 : 0);
  const padLength = decimal - (valueString.length - 1);

  if (padLength > 0) {
    valueString = "0".repeat(padLength) + valueString;
  }

  const decimalIndex = valueString.length - decimal;
  let decimalString = valueString.slice(-decimal);

  const roundDigit = Number.parseInt(decimalString[bigIntDecimal] || "0", 10);
  if (roundDigit >= 5) {
    const lastDigit = Number.parseInt(decimalString[bigIntDecimal - 1] || "0", 10);
    decimalString = `${decimalString.substring(0, bigIntDecimal - 1)}${lastDigit + 1}`;
  } else {
    decimalString = decimalString.substring(0, bigIntDecimal);
  }

  return `${isNegative ? "-" : ""}${valueString.slice(0, decimalIndex)}.${decimalString}`.replace(/\.?0*$/, "");
}

export class BigIntArithmetics {
  decimalMultiplier: bigint = 10n ** 8n;
  bigIntValue = 0n;
  decimal?: number;

  static fromBigInt(value: bigint, decimal?: number) {
    return new BigIntArithmetics({
      decimal,
      value: formatBigIntToSafeValue({ bigIntDecimal: decimal, decimal, value }),
    });
  }

  static shiftDecimals({ value, from, to }: { value: InstanceType<typeof SwapKitNumber>; from: number; to: number }) {
    return BigIntArithmetics.fromBigInt((value.getBaseValue("bigint") * toMultiplier(to)) / toMultiplier(from), to);
  }

  constructor(params: SKBigIntParams) {
    const value = getStringValue(params);
    const isComplex = typeof params === "object";
    this.decimal = isComplex ? params.decimal : undefined;

    this.decimalMultiplier =
      isComplex && "decimalMultiplier" in params
        ? params.decimalMultiplier
        : toMultiplier(Math.max(getFloatDecimals(toSafeValue(value)), this.decimal || 0));

    this.#setValue(value);
  }

  set(value: SKBigIntParams): this {
    return new (this.constructor as any)({
      decimal: this.decimal,
      identifier: (this as any).toString?.({ includeSynthProtocol: true }),
      value,
    });
  }

  add(...args: InitialisationValueType[]) {
    return this.#arithmetics("add", ...args);
  }

  sub(...args: InitialisationValueType[]) {
    return this.#arithmetics("sub", ...args);
  }

  mul(...args: InitialisationValueType[]) {
    return this.#arithmetics("mul", ...args);
  }

  div(...args: InitialisationValueType[]) {
    return this.#arithmetics("div", ...args);
  }

  gt(value: InitialisationValueType) {
    return this.#comparison("gt", value);
  }

  gte(value: InitialisationValueType) {
    return this.#comparison("gte", value);
  }

  lt(value: InitialisationValueType) {
    return this.#comparison("lt", value);
  }

  lte(value: InitialisationValueType) {
    return this.#comparison("lte", value);
  }

  eqValue(value: InitialisationValueType) {
    return this.#comparison("eqValue", value);
  }

  getValue<T extends AllowedNumberTypes>(type: T, decimal?: number): NumberPrimitivesType[T] {
    const currentDecimal = decimalFromMultiplier(this.decimalMultiplier);
    const requestedDecimal = decimal !== undefined ? decimal : this.decimal;

    let outputDecimal = requestedDecimal !== undefined ? requestedDecimal : currentDecimal;

    if (requestedDecimal !== undefined && requestedDecimal < currentDecimal) {
      const testValue = this.formatBigIntToSafeValue(this.bigIntValue, requestedDecimal);
      if (testValue === "0" && this.bigIntValue !== 0n) {
        outputDecimal = currentDecimal;
      }
    }

    const value = this.formatBigIntToSafeValue(this.bigIntValue, outputDecimal);

    return match(type as AllowedNumberTypes)
      .with("number", () => Number(value) as NumberPrimitivesType[T])
      .with("string", () => value as NumberPrimitivesType[T])
      .with("bigint", () => {
        const scaledValue = (this.bigIntValue * 10n ** BigInt(this.decimal || 8n)) / this.decimalMultiplier;
        return scaledValue as NumberPrimitivesType[T];
      })
      .otherwise(() => value as NumberPrimitivesType[T]);
  }

  getBaseValue<T extends AllowedNumberTypes>(type: T, decimal?: number): NumberPrimitivesType[T] {
    const divisor = this.decimalMultiplier / toMultiplier(decimal || this.decimal || DEFAULT_DECIMAL);
    const baseValue = divideBigIntWithRounding(this.bigIntValue, divisor);

    return match(type as AllowedNumberTypes)
      .with("number", () => Number(baseValue) as NumberPrimitivesType[T])
      .with("string", () => baseValue.toString() as NumberPrimitivesType[T])
      .otherwise(() => baseValue as NumberPrimitivesType[T]);
  }

  getBigIntValue(value: InitialisationValueType, decimal?: number) {
    if (!decimal && typeof value === "object") return value.bigIntValue;

    const stringValue = getStringValue(value);
    const safeValue = toSafeValue(stringValue);

    if (safeValue === "0" || safeValue === "undefined") return 0n;
    return this.#toBigInt(safeValue, decimal);
  }

  toSignificant(significantDigits = 6) {
    const valueStr = this.getValue("string");
    const [int = "", dec = ""] = valueStr.split(".");
    const hasInteger = Number.parseInt(int, 10) > 0;
    const totalLength = hasInteger ? int.length + dec.length : dec.length;

    if (totalLength <= significantDigits) return valueStr;
    if (int.length >= significantDigits) return int.slice(0, significantDigits).padEnd(int.length, "0");
    if (hasInteger) return `${int}.${dec.slice(0, significantDigits - int.length)}`;

    const trimmed = Number.parseInt(dec, 10).toString();
    const sliced = trimmed.slice(0, significantDigits);
    const leadingZeros = dec.length - trimmed.length;

    return `0.${sliced.padStart(leadingZeros + sliced.length, "0")}`;
  }

  toFixed(fixedDigits = 6) {
    const valueStr = this.getValue("string");
    const isNegative = valueStr.startsWith("-");
    const [int = "0", dec = ""] = (isNegative ? valueStr.slice(1) : valueStr).split(".");
    const valueRoundsToZero = int === "0" && Number.parseInt(dec.slice(0, fixedDigits), 10) === 0;
    const sign = isNegative && !valueRoundsToZero ? "-" : "";

    if (fixedDigits === 0) {
      if (int === "0" && !dec) return "0";
      const shouldRound = dec && Number.parseInt(dec[0] || "0", 10) >= 5;
      return shouldRound ? `${sign}${BigInt(int) + 1n}.0` : `${sign}${int}.0`;
    }

    if (!dec) return `${sign}${int}.${"0".repeat(fixedDigits)}`;

    const nextDigit = dec[fixedDigits];
    const shouldRound = nextDigit && Number.parseInt(nextDigit, 10) >= 5;

    if (!shouldRound) return `${sign}${int}.${dec.slice(0, fixedDigits).padEnd(fixedDigits, "0")}`;

    const decimalValue = BigInt(dec.slice(0, fixedDigits).padEnd(fixedDigits, "0")) + 1n;
    const multiplier = 10n ** BigInt(fixedDigits);

    if (decimalValue >= multiplier) return `${sign}${BigInt(int) + 1n}.${"0".repeat(fixedDigits)}`;

    return `${sign}${int}.${decimalValue.toString().padStart(fixedDigits, "0")}`;
  }

  toAbbreviation(digits = 2) {
    const valueStr = this.getValue("string");
    const value = Number(valueStr);
    const abbreviations = ["", "K", "M", "B", "T", "Q", "Qi", "S"] as const;
    const tier = Math.floor(Math.log10(Math.abs(value)) / 3);

    if (tier === 0 || !abbreviations[tier]) return valueStr;

    return `${(value / 10 ** (tier * 3)).toFixed(digits)}${abbreviations[tier]}`;
  }

  toCurrency(
    currency = "$",
    {
      currencyPosition = "start",
      decimal = 2,
      decimalSeparator = ".",
      thousandSeparator = ",",
      trimTrailingZeros = true,
    } = {},
  ) {
    const fixedValue = this.toFixed(decimal);
    const isCurrencyAtEnd = currencyPosition === "end";
    const [int = "0", dec = ""] = fixedValue.split(".");

    const formattedInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    const hasDecimals = dec && Number.parseInt(dec, 10) > 0;
    const formattedValue = hasDecimals ? `${formattedInt}${decimalSeparator}${dec}` : formattedInt;

    // Prevent regex from taking too long for large values
    const canTrimTrailingZeros = formattedValue.length < 100 && trimTrailingZeros && hasDecimals;
    const value = canTrimTrailingZeros ? formattedValue.replace(/\.?0*$/, "") : formattedValue;

    return isCurrencyAtEnd ? `${value}${currency}` : `${currency}${value}`;
  }

  formatBigIntToSafeValue(value: bigint, decimal?: number) {
    const bigIntDecimal = decimal || this.decimal || DEFAULT_DECIMAL;
    const decimalToUseForConversion = Math.max(bigIntDecimal, decimalFromMultiplier(this.decimalMultiplier));

    return formatBigIntToSafeValue({ bigIntDecimal, decimal: decimalToUseForConversion, value });
  }

  #arithmetics(method: "add" | "sub" | "mul" | "div", ...args: InitialisationValueType[]): this {
    const precisionDecimal = this.#retrievePrecisionDecimal(this, ...args);
    const currentDecimal = decimalFromMultiplier(this.decimalMultiplier);
    const targetDecimal = Math.max(precisionDecimal, currentDecimal);
    const internalDecimal = targetDecimal + PRECISION_BUFFER;
    const internalMultiplier = toMultiplier(internalDecimal);

    const result = args.reduce(
      (acc: bigint, arg) => {
        const value = this.getBigIntValue(arg, internalDecimal);

        return match(method)
          .with("add", () => acc + value)
          .with("sub", () => acc - value)
          .with("mul", () => (acc * value) / internalMultiplier)
          .with("div", () => {
            if (value === 0n) throw new RangeError("Division by zero");
            return (acc * internalMultiplier) / value;
          })
          .otherwise(() => acc);
      },
      (this.bigIntValue * internalMultiplier) / this.decimalMultiplier,
    );

    const value = formatBigIntToSafeValue({ bigIntDecimal: internalDecimal, decimal: internalDecimal, value: result });

    // @ts-expect-error False positive
    return new this.constructor({
      decimal: this.decimal,
      decimalMultiplier: toMultiplier(internalDecimal),
      identifier: this.toString(),
      value,
    });
  }

  #comparison(method: "gt" | "gte" | "lt" | "lte" | "eqValue", ...args: InitialisationValueType[]) {
    const decimal = this.#retrievePrecisionDecimal(this, ...args);
    const value = this.getBigIntValue(args[0] || "0", decimal);
    const compareToValue = this.getBigIntValue(this, decimal);

    return match(method)
      .with("gt", () => compareToValue > value)
      .with("gte", () => compareToValue >= value)
      .with("lt", () => compareToValue < value)
      .with("lte", () => compareToValue <= value)
      .with("eqValue", () => compareToValue === value)
      .otherwise(() => false);
  }

  #setValue(value: InitialisationValueType) {
    const safeValue = toSafeValue(value) || "0";
    this.bigIntValue = this.#toBigInt(safeValue);
  }

  #retrievePrecisionDecimal(...args: InitialisationValueType[]) {
    const decimals = args
      .map((arg) => {
        const isObject = typeof arg === "object";
        const value = isObject
          ? arg.decimal || decimalFromMultiplier(arg.decimalMultiplier)
          : getFloatDecimals(toSafeValue(arg));

        return value;
      })
      .filter(Boolean) as number[];

    return Math.max(...decimals, DEFAULT_DECIMAL);
  }

  #toBigInt(value: string, decimal?: number) {
    const multiplier = decimal ? toMultiplier(decimal) : this.decimalMultiplier;
    const padDecimal = decimalFromMultiplier(multiplier);
    const [integerPart = "", decimalPart = ""] = value.split(".");

    return BigInt(`${integerPart}${decimalPart.padEnd(padDecimal, "0")}`);
  }
}

const numberFormatter = Intl.NumberFormat("fullwide", { maximumFractionDigits: 20, useGrouping: false });

function toSafeValue(value: InitialisationValueType) {
  const parsedValue = typeof value === "number" ? numberFormatter.format(value) : getStringValue(value);
  const splitValue = `${parsedValue}`.replaceAll(",", ".").split(".");

  return splitValue.length > 1 ? `${splitValue.slice(0, -1).join("")}.${splitValue.at(-1)}` : splitValue[0] || "0";
}

function getFloatDecimals(value: string) {
  const decimals = value.split(".")[1]?.length || 0;
  return Math.max(decimals, DEFAULT_DECIMAL);
}

function getStringValue(param: SKBigIntParams) {
  return typeof param === "object" ? ("getValue" in param ? param.getValue("string") : param.value) : param;
}

function divideBigIntWithRounding(n: bigint, d: bigint) {
  if (d === 0n) throw new Error("Cannot divide by zero");

  const half = d / 2n;
  return (n >= 0n && d >= 0n) || (n < 0n && d < 0n) ? (n + half) / d : (n - half) / d;
}

function toMultiplier(decimal: number) {
  return 10n ** BigInt(decimal);
}

function decimalFromMultiplier(multiplier: bigint) {
  return Math.log10(Number.parseFloat(multiplier.toString()));
}
