"""Fetch real JWST/NIRCam transmission curves from the SVO Filter Profile Service."""
from __future__ import annotations
from datetime import datetime,timezone
import hashlib,json
from io import BytesIO
from pathlib import Path
import requests
from astropy.io.votable import parse_single_table

FILTERS=["F150W","F277W","F356W","F444W"]
BASE="https://svo2.cab.inta-csic.es/theory/fps/fps.php?ID=JWST/NIRCam."
def main():
 out=[]
 for name in FILTERS:
  url=BASE+name; raw=requests.get(url,timeout=60);raw.raise_for_status();table=parse_single_table(BytesIO(raw.content)).to_table()
  wavelength=[round(float(v)/1e4,6) for v in table["Wavelength"]]; transmission=[round(float(v),7) for v in table["Transmission"]]
  peak=max(transmission); effective=sum(w*t for w,t in zip(wavelength,transmission))/sum(transmission)
  out.append({"id":name,"url":url,"votableSha256":hashlib.sha256(raw.content).hexdigest(),"samples":len(wavelength),"wavelengthMicron":wavelength,"transmission":transmission,"peakTransmission":peak,"effectiveWavelengthMicron":effective})
 payload={"schema":"spectral-noise.jwst-filters/1","generatedAtUtc":datetime.now(timezone.utc).isoformat(),"service":"SVO Filter Profile Service / IVOA","serviceUrl":"https://svo2.cab.inta-csic.es/theory/fps/","jwstThroughputContext":"https://jwst-docs.stsci.edu/jwst-exposure-time-calculator-overview/jwst-etc-pandeia-engine-tutorial/jwst-etc-instrument-throughputs","filters":out,"warning":"SVO filter transmission profiles are real reference curves but are not a complete Pandeia observing-mode throughput, detector model, background, aperture correction, or ETC calculation."}
 p=Path("public/data/jwst-nircam-filters.json");p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(payload,separators=(",",":")),encoding="utf-8");print(p)
if __name__=="__main__":main()
