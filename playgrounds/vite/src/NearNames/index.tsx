import { Chain } from "@swapkit/helpers";
import { useCallback, useEffect, useState } from "react";
import type { SwapKitClient } from "../swapKitClient";

type Props = { skClient: SwapKitClient };

export default function NearNames({ skClient }: Props) {
  const [nearAddress, setNearAddress] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [ownedNames, setOwnedNames] = useState<string[]>([]);
  const [nameCost, setNameCost] = useState<string>("");
  // Fetch NEAR wallet data on mount
  useEffect(() => {
    const nearWallet = skClient.getWallet(Chain.Near);

    if (nearWallet?.address) {
      setNearAddress(nearWallet.address);
      setShowModal(true);

      // Fetch owned names using plugin
      const fetchOwnedNames = async () => {
        try {
          if (skClient.near?.nearNames) {
            const names = await skClient.near.nearNames.lookupNames(nearWallet.address);
            setOwnedNames(names);
          }
        } catch (err) {
          console.error("Failed to fetch owned names:", err);
        }
      };

      fetchOwnedNames();
    }
  }, [skClient]); // Only run once when component mounts with a NEAR wallet

  const validateName = useCallback((name: string): string | null => {
    const normalized = name.toLowerCase().replace(/\.near$/, "");

    if (normalized.length < 2) {
      return "Name must be at least 2 characters";
    }
    if (normalized.length > 64) {
      return "Name must be less than 64 characters";
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(normalized)) {
      return "Name can only contain lowercase letters, numbers, and hyphens (not at start/end)";
    }

    return null;
  }, []);

  const calculateCost = useCallback((name: string): string => {
    const length = name.toLowerCase().replace(/\.near$/, "").length;

    if (length <= 2) return "50";
    if (length <= 3) return "20";
    if (length <= 4) return "5";
    if (length <= 5) return "1";
    return "0.1";
  }, []);

  const checkAvailability = useCallback(async () => {
    if (!nameInput) return;

    const validationError = validateName(nameInput);
    if (validationError) {
      setError(validationError);
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    setError("");
    setIsAvailable(null);

    try {
      if (skClient.near?.nearNames) {
        const available = await skClient.near.nearNames.isAvailable(nameInput);
        setIsAvailable(available);

        if (available) {
          const cost = calculateCost(nameInput);
          setNameCost(cost);
        }
      }
    } catch (err) {
      setError("Failed to check availability");
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  }, [nameInput, skClient, validateName, calculateCost]);

  const registerName = useCallback(async () => {
    if (!(isAvailable && nameInput)) return;

    setIsRegistering(true);
    setError("");

    try {
      if (skClient.near?.nearNames) {
        const result = await skClient.near.nearNames.register({ name: nameInput });

        if (result) {
          alert(`Name registration successful! Transaction: ${result}`);
          setNameInput("");
          setIsAvailable(null);

          // Refresh owned names
          const names = await skClient.near.nearNames.lookupNames(nearAddress);
          setOwnedNames(names);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to register name");
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  }, [isAvailable, nameInput, nearAddress, skClient]);

  if (!(showModal && nearAddress)) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: 8,
        bottom: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        padding: 20,
        position: "fixed",
        right: 20,
        width: 400,
        zIndex: 1000,
      }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
        <h3 style={{ color: "#fff", fontSize: 16, margin: 0 }}>NEAR Names</h3>
        <button
          onClick={() => setShowModal(false)}
          style={{
            background: "none",
            border: "none",
            color: "#999",
            cursor: "pointer",
            fontSize: 24,
            lineHeight: 1,
            padding: 0,
          }}
          type="button">
          ×
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "#999", fontSize: 12, margin: "0 0 10px 0" }}>
          Connected: {nearAddress.slice(0, 10)}...{nearAddress.slice(-6)}
        </p>

        {ownedNames.length > 0 && (
          <div style={{ marginBottom: 15 }}>
            <p style={{ color: "#e0e0e0", fontSize: 12, fontWeight: 600, margin: "0 0 8px 0" }}>Your Names:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ownedNames.map((name) => (
                <div
                  key={name}
                  style={{
                    backgroundColor: "#222",
                    border: "1px solid #333",
                    borderRadius: 4,
                    color: "#2563eb",
                    fontSize: 13,
                    padding: "4px 8px",
                  }}>
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 15 }}>
        <label
          htmlFor="nearNameInput"
          style={{ color: "#e0e0e0", display: "block", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          Register new name:
        </label>
        <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <input
            id="nearNameInput"
            onChange={(e) => {
              setNameInput(e.target.value);
              setIsAvailable(null);
              setError("");
            }}
            placeholder="yourname"
            style={{ flex: 1 }}
            type="text"
            value={nameInput}
          />
          <span style={{ color: "#666", fontSize: 13 }}>.near</span>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#2a1a1a",
            borderRadius: 4,
            color: "#ef4444",
            fontSize: 12,
            marginBottom: 10,
            padding: 8,
          }}>
          {error}
        </div>
      )}

      {isAvailable === true && (
        <div
          style={{
            backgroundColor: "#1a2a1a",
            borderRadius: 4,
            color: "#22c55e",
            fontSize: 12,
            marginBottom: 10,
            padding: 8,
          }}>
          ✓ Available! Cost: {nameCost} NEAR
        </div>
      )}

      {isAvailable === false && (
        <div
          style={{
            backgroundColor: "#2a1a1a",
            borderRadius: 4,
            color: "#ef4444",
            fontSize: 12,
            marginBottom: 10,
            padding: 8,
          }}>
          ✗ Name already taken
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          disabled={!nameInput || isChecking || isRegistering}
          onClick={checkAvailability}
          style={{ flex: 1 }}
          type="button">
          {isChecking ? "Checking..." : "Check Availability"}
        </button>

        {isAvailable === true && (
          <button
            disabled={isRegistering}
            onClick={registerName}
            style={{
              backgroundColor: isRegistering ? "#2a2a2a" : "#22c55e",
              borderColor: isRegistering ? "#333" : "#22c55e",
              flex: 1,
            }}
            type="button">
            {isRegistering ? "Registering..." : `Register (${nameCost} NEAR)`}
          </button>
        )}
      </div>

      <p style={{ color: "#666", fontSize: 10, lineHeight: 1.4, marginBottom: 0, marginTop: 12 }}>
        2-char: 50 NEAR, 3-char: 20 NEAR, 4-char: 5 NEAR, 5-char: 1 NEAR, 6+: 0.1 NEAR
      </p>
    </div>
  );
}
