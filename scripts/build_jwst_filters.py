"""Fetch and validate JWST/NIRCam profiles from the SVO Filter Profile Service."""
from __future__ import annotations

from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
from pathlib import Path

from astropy.io.votable import parse_single_table
import requests

FILTERS = ["F150W", "F277W", "F356W", "F444W"]
BASE = "https://svo2.cab.inta-csic.es/theory/fps/fps.php?ID=JWST/NIRCam."
USER_AGENT = "spectral-noise-budget-studio/1.1 (+https://github.com/Biswajit1999/spectral-noise-budget-studio)"


def trapezoid(x: list[float], y: list[float]) -> float:
    return sum((x[index + 1] - x[index]) * (y[index] + y[index + 1]) / 2 for index in range(len(x) - 1))


def validate(name: str, wavelength: list[float], transmission: list[float]) -> None:
    if len(wavelength) != len(transmission) or len(wavelength) < 2:
        raise ValueError(f"{name}: arrays must have equal length >= 2")
    if any(right <= left for left, right in zip(wavelength, wavelength[1:])):
        raise ValueError(f"{name}: wavelength grid is not strictly increasing")
    if any(value < 0 or value > 1 for value in transmission):
        raise ValueError(f"{name}: transmission must remain in [0, 1]")


def main() -> None:
    output: list[dict[str, object]] = []
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    for name in FILTERS:
        url = BASE + name
        response = session.get(url, timeout=60)
        response.raise_for_status()
        table = parse_single_table(BytesIO(response.content)).to_table()
        wavelength = [round(float(value) / 1e4, 6) for value in table["Wavelength"]]
        transmission = [round(float(value), 7) for value in table["Transmission"]]
        validate(name, wavelength, transmission)
        peak = max(transmission)
        transmission_integral = trapezoid(wavelength, transmission)
        first_moment = trapezoid(wavelength, [wave * value for wave, value in zip(wavelength, transmission)])
        weighted_mean = first_moment / transmission_integral
        pivot = (first_moment / trapezoid(wavelength, [value / wave for wave, value in zip(wavelength, transmission)])) ** 0.5
        output.append({
            "id": name,
            "url": url,
            "votableSha256": hashlib.sha256(response.content).hexdigest(),
            "samples": len(wavelength),
            "wavelengthMicron": wavelength,
            "transmission": transmission,
            "peakTransmission": peak,
            "transmissionWeightedMeanMicron": weighted_mean,
            "pivotWavelengthMicron": pivot,
            "equivalentWidthMicron": transmission_integral / peak,
        })

    payload = {
        "schema": "spectral-noise.jwst-filters/2",
        "retrievedAtUtc": datetime.now(timezone.utc).isoformat(),
        "service": "SVO Filter Profile Service / IVOA",
        "serviceUrl": "https://svo2.cab.inta-csic.es/theory/fps/",
        "jwstThroughputContext": "https://jwst-docs.stsci.edu/jwst-exposure-time-calculator-overview/jwst-etc-pandeia-engine-tutorial/jwst-etc-instrument-throughputs",
        "filters": output,
        "warning": "These system-throughput profiles support placement triage, not a complete Pandeia observing-mode, detector, background, extraction, saturation, or ETC calculation.",
    }
    path = Path("public/data/jwst-nircam-filters.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, separators=(",", ":")) + "\n", encoding="utf-8")
    print(path)


if __name__ == "__main__":
    main()
