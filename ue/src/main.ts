const SERVICE_UUID = "000061fe-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "c6d6dc0d-07f5-47ef-9b59-630622b01fd3";
const DEFAULT_MAC = "00E04C239988";

let payloadData: Uint8Array<ArrayBuffer> | null = null;

function log(message: string): void {
  const logElement = document.getElementById("log");
  if (!logElement) {
    throw new Error("Could not find the execution log in the HTML.");
  }

  logElement.textContent += `${message}\n`;
  logElement.scrollTop = logElement.scrollHeight;
  console.log(message);
}

function getTargetMac(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("mac")) {
    return DEFAULT_MAC;
  }

  const mac = (params.get("mac") ?? "").replace(/[:\-\s]/g, "").toUpperCase();
  return /^[0-9A-F]{12}$/.test(mac) ? mac : null;
}

function buildPayload(mac: string): Uint8Array<ArrayBuffer> {
  const macBytes: number[] = [];
  for (let index = 0; index < mac.length; index += 2) {
    macBytes.push(Number.parseInt(mac.slice(index, index + 2), 16));
  }
  macBytes.push(0x01);
  return new Uint8Array(macBytes);
}

async function connectAndWakeSpeaker(button: HTMLButtonElement): Promise<void> {
  const payload = payloadData;
  if (!payload) {
    log("ERROR: Invalid MAC address; cannot create the wake-up payload.");
    return;
  }

  if (!navigator.bluetooth) {
    log("ERROR: This browser does not support Web Bluetooth.");
    return;
  }

  button.disabled = true;
  try {
    log("Choose the Logitech UE speaker...");
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID, 0x61fe],
    });
    log(`Selected: ${device.name ?? "Unnamed device"}`);

    if (!device.gatt) {
      throw new Error("The selected device does not support GATT.");
    }

    log("Connecting to GATT...");
    const gattServer = await device.gatt.connect();
    log("GATT connected.");

    log("Searching for the service...");
    const service = await gattServer.getPrimaryService(SERVICE_UUID);
    log("Searching for the power characteristic...");
    const powerCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    const hexPayload = Array.from(payload)
      .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");
    log(`Writing payload: ${hexPayload}`);

    if (!powerCharacteristic.properties.write) {
      throw new Error("The characteristic does not support write with response.");
    }
    await powerCharacteristic.writeValueWithResponse(payload);

    log("Write succeeded. Check whether the speaker has powered on.");
  } catch (error) {
    log(`Operation failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    button.disabled = false;
  }
}

function main(): void {
  const actionButton = document.querySelector<HTMLButtonElement>("#btnConnectAndWake");
  if (!actionButton) {
    throw new Error("Could not find the speaker action button in the HTML.");
  }

  const macDisplay = document.getElementById("macDisplay");
  if (!macDisplay) {
    throw new Error("Could not find the MAC display in the HTML.");
  }

  const payloadDisplay = document.getElementById("payloadDisplay");
  if (!payloadDisplay) {
    throw new Error("Could not find the payload display in the HTML.");
  }

  const targetMac = getTargetMac();
  if (!targetMac) {
    log("Invalid MAC address in the URL. Enter 12 hexadecimal digits, for example 00E04C239988.");
    macDisplay.textContent = "Invalid format";
    payloadDisplay.textContent = "";
    actionButton.disabled = true;
    return;
  }

  payloadData = buildPayload(targetMac);
  macDisplay.textContent = targetMac;
  payloadDisplay.textContent = Array.from(payloadData)
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");

  actionButton.addEventListener("click", () => {
    void connectAndWakeSpeaker(actionButton);
  });
}

main();
