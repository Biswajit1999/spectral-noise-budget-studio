"""Compare the two nonzero NIRCam responses at the declared methane marker."""

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np


def main():
    root = Path(__file__).resolve().parents[1]
    source = json.loads((root / "public/data/jwst-nircam-filters.json").read_text())
    audit = json.loads((root / "public/data/feature-passband-audit.json").read_text())
    marker = next(row for row in audit["features"] if row["id"] == "ch4-330")["wavelengthMicron"]
    colours = {"F277W": "#975225", "F356W": "#21627a"}
    with plt.rc_context({"font.size": 11, "axes.spines.top": False, "axes.spines.right": False}):
        fig, ax = plt.subplots(figsize=(7.8, 4.5), layout="constrained")
        ax.set_title("The same CH₄ marker falls on a filter edge and in a core", loc="left", fontweight="bold")
        for profile in source["filters"]:
            name = profile["id"]
            if name not in colours:
                continue
            wavelength = np.asarray(profile["wavelengthMicron"])
            throughput = np.asarray(profile["transmission"])
            response = throughput / throughput.max()
            at_marker = np.interp(marker, wavelength, response, left=0, right=0)
            ax.semilogy(
                wavelength, np.where(response > 0, response, np.nan), color=colours[name], lw=1.8,
                label=f"{name} · {at_marker:.3%} of its peak at 3.30 µm",
            )
            ax.scatter([marker], [at_marker], color=colours[name], s=32, zorder=4)
        ax.axvline(marker, color="#67737a", linestyle="--", lw=1)
        ax.axhline(0.5, color="#aeb7bf", linestyle=":", lw=1)
        ax.set(xlim=(2.25, 4.15), ylim=(1e-5, 1.3), xlabel="Wavelength (µm)",
               ylabel="Throughput / filter peak")
        ax.legend(frameon=False, loc="lower left", fontsize=9)
        ax.grid(axis="y", color="#dfe4e8", lw=0.65)
        ax.set_axisbelow(True)
        fig.savefig(root / "public/methane-filter-edge.png", dpi=120)
        plt.close(fig)


if __name__ == "__main__":
    main()
