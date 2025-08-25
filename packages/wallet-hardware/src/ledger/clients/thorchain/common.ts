export const CLA = 0x55;
export const CHUNK_SIZE = 250;
export const APP_KEY = "CSM";

export const INS = {
  GET_ADDR_SECP256K1: 0x04,
  GET_VERSION: 0x00,
  INS_PUBLIC_KEY_SECP256K1: 0x01, // Obsolete
  SIGN_SECP256K1: 0x02,
};

export const PAYLOAD_TYPE = { ADD: 0x01, INIT: 0x00, LAST: 0x02 };

export const P1_VALUES = { ONLY_RETRIEVE: 0x00, SHOW_ADDRESS_IN_DEVICE: 0x01 };

export const P2_VALUES = { JSON: 0x0 };

export const ERROR_CODE = { NoError: 0x9000 };

const ERROR_DESCRIPTION: any = {
  1: "U2F: Unknown",
  2: "U2F: Bad request",
  3: "U2F: Configuration unsupported",
  4: "U2F: Device Ineligible",
  5: "U2F: Timeout",
  14: "Timeout",
  25600: "Execution Error",
  26368: "Wrong Length",
  26626: "Error deriving keys",
  27010: "Empty Buffer",
  27011: "Output buffer too small",
  27012: "Data is invalid",
  27013: "Conditions not satisfied",
  27014: "Transaction rejected",
  27264: "Bad key handle",
  27392: "Invalid P1/P2",
  27904: "Instruction not supported",
  28160: "App does not seem to be open",
  28416: "Unknown error",
  28417: "Sign/verify error",
  36864: "No errors",
  36865: "Device is busy",
};

export function errorCodeToString(statusCode: number) {
  if (statusCode in ERROR_DESCRIPTION) return ERROR_DESCRIPTION[statusCode];
  return `Unknown Status Code: ${statusCode}`;
}

function isDict(v: any) {
  return typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

export function processErrorResponse(response: any) {
  if (response) {
    if (isDict(response)) {
      if (Object.hasOwn(response, "statusCode")) {
        return { error_message: errorCodeToString(response.statusCode), return_code: response.statusCode };
      }

      if (Object.hasOwn(response, "return_code") && Object.hasOwn(response, "error_message")) {
        return response;
      }
    }
    return { error_message: response.toString(), return_code: 0xffff };
  }

  return { error_message: response.toString(), return_code: 0xffff };
}

export function getVersion(transport: any) {
  return transport.send(CLA, INS.GET_VERSION, 0, 0).then((response: any) => {
    const errorCodeData = response.slice(-2);
    const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

    let targetId = 0;
    if (response.length >= 9) {
      targetId = (response[5] << 24) + (response[6] << 16) + (response[7] << 8) + (response[8] << 0);
    }

    return {
      device_locked: response[4] === 1,
      error_message: errorCodeToString(returnCode),
      major: response[1],
      minor: response[2],
      patch: response[3],
      return_code: returnCode,
      target_id: targetId.toString(16),
      // ///
      test_mode: response[0] !== 0,
    };
  }, processErrorResponse);
}
