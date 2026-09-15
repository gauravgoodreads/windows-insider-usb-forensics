from typing import Any

USB_FIELDS = ("vendor", "product", "device_identifier", "serial_number", "volume_label", "drive_letter", "first_seen", "last_seen", "source_registry_key")

def normalize_usb_fields(record: dict[str, Any]) -> dict[str, Any]:
    """Return explicit nulls for unavailable device attributes; never invent values."""
    normalized = {key: record.get(key) or None for key in USB_FIELDS}
    normalized["observed"] = [key for key in USB_FIELDS if normalized[key] is not None]
    normalized["unavailable"] = [key for key in USB_FIELDS if normalized[key] is None]
    return normalized

