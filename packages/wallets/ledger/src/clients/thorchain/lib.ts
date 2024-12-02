import crypto from "crypto";
import type Transport from "@ledgerhq/hw-transport";
/** ******************************************************************************
 *  (c) 2019 ZondaX GmbH
 *  (c) 2016-2017 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ******************************************************************************* */
import { bech32 } from "@scure/base";
import Ripemd160 from "ripemd160";

import {
  CHUNK_SIZE,
  CLA,
  ERROR_CODE,
  INS,
  P1_VALUES,
  P2_VALUES,
  errorCodeToString,
  getVersion,
  processErrorResponse,
} from "./common";
import {
  publicKeyv1,
  publicKeyv2,
  serializePathv1,
  serializePathv2,
  signSendChunkv1,
  signSendChunkv2,
} from "./helpers";

export class THORChainApp {
  transport: Transport;
  versionResponse: any;

  constructor(transport: any) {
    if (!transport) {
      throw new Error("Transport has not been defined");
    }

    this.transport = transport;
  }

  static serializeHRP(hrp: string) {
    if (hrp == null || hrp.length < 3 || hrp.length > 83) {
      throw new Error("Invalid HRP");
    }
    const buf = Buffer.alloc(1 + hrp.length);
    buf.writeUInt8(hrp.length, 0);
    buf.write(hrp, 1);
    return buf;
  }

  static getBech32FromPK(hrp: string, pk: Buffer) {
    if (pk.length !== 33) {
      throw new Error("expected compressed public key [31 bytes]");
    }
    // @ts-ignore
    const hashSha256 = crypto.createHash("sha256").update(pk).digest();
    // @ts-ignore
    const hashRip = new Ripemd160().update(hashSha256).digest();
    // @ts-ignore
    const encode = bech32.encode || bech32.bech32.encode;
    // @ts-ignore
    const toWords = bech32.toWords || bech32.bech32.toWords;
    // @ts-ignore
    return encode(hrp, toWords(hashRip));
  }

  async serializePath(path: number[]) {
    this.versionResponse = await getVersion(this.transport);

    if (this.versionResponse.return_code !== ERROR_CODE.NoError) {
      throw this.versionResponse;
    }

    switch (this.versionResponse.major) {
      case 1:
        return serializePathv1(path);
      case 2:
        return serializePathv2(path);
      default:
        return Buffer.alloc(0);
    }
  }

  async signGetChunks(path: number[], buffer: Buffer) {
    const serializedPath = await this.serializePath(path);

    const chunks = [];
    chunks.push(serializedPath);

    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;
      if (i > buffer.length) {
        end = buffer.length;
      }
      chunks.push(buffer.subarray(i, end));
    }

    return chunks;
  }

  async getVersion() {
    try {
      this.versionResponse = await getVersion(this.transport);
      return this.versionResponse;
    } catch (e) {
      return processErrorResponse(e);
    }
  }

  async appInfo() {
    return this.transport.send(0xb0, 0x01, 0, 0).then((response: any) => {
      const errorCodeData = response.slice(-2);
      const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

      let appName = "";
      let appVersion = "";
      let flagLen = 0;
      let flagsValue = 0;

      if (response[0] !== 1) {
        // Ledger responds with format ID 1. There is no spec for any format != 1
        return {
          return_code: 0x9001,
          error_message: "response format ID not recognized",
        };
      }

      const appNameLen = response[1];
      appName = response.slice(2, 2 + appNameLen).toString("ascii");
      let idx = 2 + appNameLen;
      const appVersionLen = response[idx];
      idx += 1;
      appVersion = response.slice(idx, idx + appVersionLen).toString("ascii");
      idx += appVersionLen;
      const appFlagsLen = response[idx];
      idx += 1;
      flagLen = appFlagsLen;
      flagsValue = response[idx];

      return {
        return_code: returnCode,
        error_message: errorCodeToString(returnCode),
        appName,
        appVersion,
        flagLen,
        flagsValue,
        flag_recovery: (flagsValue & 1) !== 0,
        flag_signed_mcu_code: (flagsValue & 2) !== 0,
        flag_onboarded: (flagsValue & 4) !== 0,
        flag_pin_validated: (flagsValue & 128) !== 0,
      };
    }, processErrorResponse);
  }

  async deviceInfo() {
    return this.transport
      .send(0xe0, 0x01, 0, 0, Buffer.from([]), [ERROR_CODE.NoError, 0x6e00])
      .then((response: any) => {
        const errorCodeData = response.slice(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

        if (returnCode === 0x6e00) {
          return {
            return_code: returnCode,
            error_message: "This command is only available in the Dashboard",
          };
        }

        const targetId = response.slice(0, 4).toString("hex");

        let pos = 4;
        const secureElementVersionLen = response[pos];
        pos += 1;
        const seVersion = response.slice(pos, pos + secureElementVersionLen).toString();
        pos += secureElementVersionLen;

        const flagsLen = response[pos];
        pos += 1;
        const flag = response.slice(pos, pos + flagsLen).toString("hex");
        pos += flagsLen;

        const mcuVersionLen = response[pos];
        pos += 1;
        // Patch issue in mcu version
        let tmp = response.slice(pos, pos + mcuVersionLen);
        if (tmp[mcuVersionLen - 1] === 0) {
          tmp = response.slice(pos, pos + mcuVersionLen - 1);
        }
        const mcuVersion = tmp.toString();

        return {
          return_code: returnCode,
          error_message: errorCodeToString(returnCode),
          // //
          targetId,
          seVersion,
          flag,
          mcuVersion,
        };
      }, processErrorResponse);
  }

  async publicKey(path: number[]) {
    try {
      const serializedPath = await this.serializePath(path);

      switch (this.versionResponse.major) {
        case 1:
          return publicKeyv1(this, serializedPath);
        case 2: {
          // @ts-ignore
          const data = Buffer.concat([THORChainApp.serializeHRP("thor"), serializedPath]);
          return publicKeyv2(this, data);
        }
        default:
          return {
            return_code: 0x6400,
            error_message: "App Version is not supported",
          };
      }
    } catch (e) {
      return processErrorResponse(e);
    }
  }

  async getAddressAndPubKey(path: number[], hrp: string, showInDevice = false) {
    return this.serializePath(path)
      .then((serializedPath: Buffer) => {
        // @ts-ignore
        const data = Buffer.concat([THORChainApp.serializeHRP(hrp), serializedPath]);
        return this.transport
          .send(
            CLA,
            INS.GET_ADDR_SECP256K1,
            showInDevice ? P1_VALUES.SHOW_ADDRESS_IN_DEVICE : P1_VALUES.ONLY_RETRIEVE,
            0,
            data,
            [ERROR_CODE.NoError],
          )
          .then((response: any) => {
            const errorCodeData = response.slice(-2);
            const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

            const compressedPk = Buffer.from(response.slice(0, 33));
            const bech32Address = Buffer.from(response.slice(33, -2)).toString();

            return {
              bech32_address: bech32Address,
              compressed_pk: compressedPk,
              return_code: returnCode,
              error_message: errorCodeToString(returnCode),
            };
          }, processErrorResponse);
      })
      .catch((err) => processErrorResponse(err));
  }

  showAddressAndPubKey(path: number[], hrp: string) {
    return this.getAddressAndPubKey(path, hrp, true);
  }

  signSendChunk(chunkIdx: number, chunkNum: number, chunk: Buffer, txType = P2_VALUES.JSON) {
    switch (this.versionResponse.major) {
      case 1:
        return signSendChunkv1(this, chunkIdx, chunkNum, chunk, txType);
      case 2:
        return signSendChunkv2(this, chunkIdx, chunkNum, chunk, txType);
      default:
        return {
          return_code: 0x6400,
          error_message: "App Version is not supported",
        };
    }
  }

  async sign(path: number[], buffer: Buffer, txType = P2_VALUES.JSON) {
    let chunks: Buffer[] = [];
    let response: any;
    try {
      chunks = await this.signGetChunks(path, buffer);
      response = await this.signSendChunk(1, chunks.length, chunks[0] as Buffer, txType);
    } catch (error) {
      processErrorResponse(error);
    }
    let result = {
      return_code: response.return_code,
      error_message: response.error_message,
      signature: null,
    };

    for (let i = 1; i < chunks.length; i += 1) {
      result = await this.signSendChunk(1 + i, chunks.length, chunks[i] as Buffer, txType);
      if (result.return_code !== ERROR_CODE.NoError) {
        break;
      }
    }

    return {
      return_code: result.return_code,
      error_message: result.error_message,
      signature: result.signature,
    };
  }
}
