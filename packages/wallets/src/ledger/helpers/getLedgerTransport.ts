import type Transport from "@ledgerhq/hw-transport";
import { SwapKitError } from "@swapkit/helpers";

const getNavigatorUsb = () =>
  // @ts-ignore
  navigator?.usb as unknown as {
    getDevices: () => Promise<any[]>;
    requestDevice: (requestObject: any) => Promise<any>;
    removeEventListener: (event: string, callback: (e: any) => void) => void;
    addEventListener: (event: string, callback: (e: any) => void) => void;
  };

const getLedgerDevices = async () => {
  const navigatorUsb = getNavigatorUsb();

  if (typeof navigatorUsb?.getDevices !== "function") return [];
  const { ledgerUSBVendorId } = await import("@ledgerhq/devices");

  const devices = await navigatorUsb?.getDevices();
  const existingDevices = devices.filter((d) => d.vendorId === ledgerUSBVendorId);
  if (existingDevices.length > 0) return existingDevices[0];

  return navigatorUsb?.requestDevice({ filters: [{ vendorId: ledgerUSBVendorId }] });
};

export const getLedgerTransport = async () => {
  const device = await getLedgerDevices();

  if (!device) {
    throw new SwapKitError("wallet_ledger_device_not_found");
  }

  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);

  try {
    await device.reset();
  } catch {
    // reset fails on devices that are already open
  }

  const iface = device.configurations[0].interfaces.find(
    ({ alternates }: { alternates: { interfaceClass: number }[] }) =>
      alternates.some(({ interfaceClass }) => interfaceClass === 255),
  );

  if (!iface) {
    await device.close();
    throw new SwapKitError("wallet_ledger_connection_error");
  }

  try {
    await device.claimInterface(iface.interfaceNumber);
  } catch (error: unknown) {
    await device.close();

    throw new SwapKitError("wallet_ledger_connection_claimed", error);
  }

  const { default: Transport } = await import("@ledgerhq/hw-transport-webusb");
  const isSupported = await Transport.isSupported();
  if (!isSupported) throw new Error("WebUSB not supported");

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
