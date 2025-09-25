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
  useEffect(() => {
    const nearWallet = skClient.getWallet(Chain.Near);

    if (nearWallet?.address) {
      setNearAddress(nearWallet.address);
      setShowModal(true);

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
  }, [skClient]);

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
        background: "white",
        border: "1px solid #ccc",
        borderRadius: 8,
        bottom: 20,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        padding: 20,
        position: "fixed",
        right: 20,
        width: 400,
        zIndex: 1000,
      }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
        <h3 style={{ margin: 0 }}>NEAR Names</h3>
        <button
          onClick={() => setShowModal(false)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
          type="button">
          ×
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ color: "#666", fontSize: 14, margin: "0 0 10px 0" }}>
          Connected: {nearAddress.slice(0, 8)}...{nearAddress.slice(-8)}
        </p>

        {ownedNames.length > 0 && (
          <div style={{ marginBottom: 15 }}>
            <p style={{ fontSize: 14, fontWeight: "bold", margin: "0 0 5px 0" }}>Your Names:</p>
            {ownedNames.map((name) => (
              <div key={name} style={{ color: "#333", fontSize: 14, padding: "2px 0" }}>
                {name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 15 }}>
        <label htmlFor="nearNameInput" style={{ display: "block", fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>
          Register a new .near name:
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            id={`nearNameInput-${Math.random()}`}
            onChange={(e) => {
              setNameInput(e.target.value);
              setIsAvailable(null);
              setError("");
            }}
            placeholder="yourname"
            style={{ border: "1px solid #ccc", borderRadius: 4, flex: 1, fontSize: 14, padding: "8px 12px" }}
            type="text"
            value={nameInput}
          />
          <span style={{ alignItems: "center", color: "#666", display: "flex", fontSize: 14 }}>.near</span>
        </div>
      </div>

      {error && <div style={{ color: "red", fontSize: 14, marginBottom: 10 }}>{error}</div>}

      {isAvailable === true && (
        <div style={{ color: "green", fontSize: 14, marginBottom: 10 }}>✓ Available! Cost: {nameCost} NEAR</div>
      )}

      {isAvailable === false && (
        <div style={{ color: "red", fontSize: 14, marginBottom: 10 }}>✗ This name is already taken</div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          disabled={!nameInput || isChecking || isRegistering}
          onClick={checkAvailability}
          style={{
            background: "#0066cc",
            border: "none",
            borderRadius: 4,
            color: "white",
            cursor: !nameInput || isChecking ? "not-allowed" : "pointer",
            flex: 1,
            fontSize: 14,
            opacity: !nameInput || isChecking ? 0.6 : 1,
            padding: "10px 15px",
          }}
          type="button">
          {isChecking ? "Checking..." : "Check Availability"}
        </button>

        {isAvailable === true && (
          <button
            disabled={isRegistering}
            onClick={registerName}
            style={{
              background: "#00cc66",
              border: "none",
              borderRadius: 4,
              color: "white",
              cursor: isRegistering ? "not-allowed" : "pointer",
              flex: 1,
              fontSize: 14,
              opacity: isRegistering ? 0.6 : 1,
              padding: "10px 15px",
            }}
            type="button">
            {isRegistering ? "Registering..." : `Register (${nameCost} NEAR)`}
          </button>
        )}
      </div>

      <p style={{ color: "#999", fontSize: 12, marginBottom: 0, marginTop: 15 }}>
        Shorter names cost more. 2-char: 50 NEAR, 3-char: 20 NEAR, 4-char: 5 NEAR, 5-char: 1 NEAR, 6+: 0.1 NEAR
      </p>
    </div>
  );
}
