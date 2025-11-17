import type Transport from "@ledgerhq/hw-transport";
import { SwapKitError } from "@swapkit/helpers";

const getNavigatorUsb = () =>
  navigator?.usb as unknown as {
    getDevices: () => Promise<any[]>;
    requestDevice: (requestObject: any) => Promise<any>;
    removeEventListener: (event: string, callback: (e: any) => void) => void;
    addEventListener: (event: string, callback: (e: any) => void) => void;
  };

const getLedgerDevices = async (): Promise<USBDevice> => {
  const navigatorUsb = getNavigatorUsb();

  if (typeof navigatorUsb?.getDevices !== "function") return {} as USBDevice;
  const { ledgerUSBVendorId } = await import("@ledgerhq/devices");

  const devices = await navigatorUsb?.getDevices();
  const existingDevices = devices.filter((d) => d.vendorId === ledgerUSBVendorId);
  if (existingDevices.length > 0) return existingDevices[0];

  return navigatorUsb?.requestDevice({ filters: [{ vendorId: ledgerUSBVendorId }] });
};

export const getLedgerTransport = async (): Promise<Transport> => {
  const device = await getLedgerDevices();

  if (!device) {
    throw new SwapKitError("wallet_ledger_device_not_found");
  }

  device.opened || (await device.open());
  if (device.configuration === null) await device.selectConfiguration(1);

  try {
    await device.reset();
  } catch {
    // reset fails on devices that are already open
  }

  const configuration = device.configuration ?? device.configurations?.[0];

  const iface =
    configuration?.interfaces.find(({ alternates }: { alternates: { interfaceClass: number }[] }) =>
      alternates.some(({ interfaceClass }) => interfaceClass === 0xff),
    ) ||
    configuration?.interfaces.find(({ alternates }: { alternates: { interfaceClass: number }[] }) =>
      alternates.some(({ interfaceClass }) => interfaceClass === 0x03),
    );

  if (!iface) {
    await device.close();
    throw new SwapKitError("wallet_ledger_connection_error");
  }

  const klass0x03 = (iface.alternates as any[])?.find(
    ({ interfaceClass }: { interfaceClass: number }) => interfaceClass === 0x03,
  )?.interfaceClass as number;

  const klass0xff = (iface.alternates as any[])?.find(
    ({ interfaceClass }: { interfaceClass: number }) => interfaceClass === 0xff,
  )?.interfaceClass as number;

  if (klass0x03 && !klass0xff) {
    // -------- HID class (NEAR, ETH, SOL, etc.) -> WebHID transport --------
    const TransportWebHID = (await import("@ledgerhq/hw-transport-webhid")).default;
    const supported = await TransportWebHID.isSupported();
    if (!supported) {
      await device.close();
      throw new SwapKitError("wallet_ledger_webhid_not_supported");
    }
    const transport = await TransportWebHID.create();
    return transport;
  }

  try {
    await device.claimInterface(iface.interfaceNumber);
  } catch (error: unknown) {
    await device.close();

    throw new SwapKitError("wallet_ledger_connection_claimed", error);
  }

  const Transport = (await import("@ledgerhq/hw-transport-webusb")).default;
  const isSupported = await Transport.isSupported();
  if (!isSupported) throw new SwapKitError("wallet_ledger_webusb_not_supported");

  const { DisconnectedDevice } = await import("@ledgerhq/errors");

  const transport = new Transport(device, iface.interfaceNumber);

  const onDisconnect = (e: any) => {
    if (device === e.device) {
      getNavigatorUsb()?.removeEventListener("disconnect", onDisconnect);

      transport._emitDisconnect(new DisconnectedDevice());
    }
  };
  getNavigatorUsb()?.addEventListener("disconnect", onDisconnect);

  return transport as Transport;
};
