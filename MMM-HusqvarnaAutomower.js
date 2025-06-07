Module.register("MMM-HusqvarnaAutomower", {
  defaults: {
    
  },

  start() {
    this.mowerData = null;
    this.getAccessToken();
                this.tokenExpiresAt = 0; // Zeit in ms (UNIX timestamp)
    this.updateTimer = null;
    this.getAccessToken(); // initialer Tokenabruf
    this.scheduleUpdate();
  },

  scheduleUpdate() {
    this.updateTimer = setInterval(() => {
      const bufferTime = 5 * 60 * 1000; // 5 Minuten vor Ablauf
      const now = Date.now();

      if (!this.accessToken || now >= this.tokenExpiresAt - bufferTime) {
        console.log("[MMM-HusqvarnaAutomower] Hole neuen Access Token.");
        this.getAccessToken();
      } else {
        this.getMowerStatus();
      }
    }, this.config.updateInterval);
  },

  getAccessToken() {
    const payload = new URLSearchParams();
    payload.append("grant_type", "client_credentials");
    payload.append("client_id", this.config.client_id);
    payload.append("client_secret", this.config.client_secret);

    fetch("https://api.authentication.husqvarnagroup.dev/v1/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    })
      .then((res) => res.json())
      .then((data) => {
      if (data.access_token && data.expires_in) {
        this.accessToken = data.access_token;
        const expiresInMs = data.expires_in * 1000;
        this.tokenExpiresAt = Date.now() + expiresInMs;

        this.getMowerStatus();
       } else {
         console.error("Token-Anfrage fehlgeschlagen:", data);
      }
    })
    .catch((err) => console.error("OAuth2 Fehler:", err));
  },

  getMowerStatus() {
    fetch("https://api.amc.husqvarna.dev/v1/mowers", {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Authorization-Provider": "husqvarna",
        "X-Api-Key": this.config.client_id,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        this.mowerData = data;
        this.updateDom();
      })
      .catch((err) => console.error("Mäher-Status Fehler:", err));
  },


  getErrorMessage(errorCode_ger) {
  switch (errorCode_ger) {
    case 0: return "Unerwarteter Fehler";
    case 1: return "Außerhalb des Arbeitsbereichs";
    case 2: return "Kein Schleifensignal";
    case 3: return "Falsches Schleifensignal";
    case 4: return "Problem mit dem Schleifensensor vorne";
    case 5: return "Problem mit dem Schleifensensor hinten";
    case 6: return "Problem mit dem Schleifensensor links";
    case 7: return "Problem mit dem Schleifensensor rechts";
    case 8: return "Falscher PIN-Code";
    case 9: return "Eingeklemmt";
    case 10: return "Umgekippt";
    case 11: return "Batterie schwach";
    case 12: return "Batterie leer";
    case 13: return "Kein Antrieb";
    case 14: return "Mäher angehoben";
    case 15: return "Angehoben";
    case 16: return "In Ladestation festgefahren";
    case 17: return "Ladestation blockiert";
    case 18: return "Problem mit Kollisionssensor hinten";
    case 19: return "Problem mit Kollisionssensor vorne";
    case 20: return "Radmotor blockiert rechts";
    case 21: return "Radmotor blockiert links";
    case 22: return "Problem mit Radantrieb rechts";
    case 23: return "Problem mit Radantrieb links";
    case 24: return "Schneidsystem blockiert";
    case 25: return "Schneidsystem blockiert";
    case 26: return "Ungültige Subgeräte-Kombination";
    case 27: return "Einstellungen wiederhergestellt";
    case 28: return "Problem mit dem Speicherstromkreis";
    case 29: return "Hang zu steil";
    case 30: return "Problem mit dem Ladesystem";
    case 31: return "Problem mit STOP-Knopf";
    case 32: return "Problem mit Neigungssensor";
    case 33: return "Mäher geneigt";
    case 34: return "Schneiden gestoppt – Hang zu steil";
    case 35: return "Radmotor überlastet rechts";
    case 36: return "Radmotor überlastet links";
    case 37: return "Ladestrom zu hoch";
    case 38: return "Elektronisches Problem";
    case 39: return "Problem mit Schneidmotor";
    case 40: return "Begrenzter Schnitthöhenbereich";
    case 42: return "Begrenzter Schnitthöhenbereich";
    case 41: return "Unerwartete Schnitthöhenanpassung";
    case 43: return "Problem mit Schnitthöhenantrieb";
    case 44: return "Problem mit aktueller Schnitthöhe";
    case 45: return "Problem mit Schnitthöhenrichtung";
    case 46: return "Schnitthöhe blockiert";
    case 47: return "Problem mit Schnitthöhe";
    case 48: return "Keine Antwort vom Ladegerät";
    case 49: return "Ultraschallproblem";
    case 50: return "Leitkabel 1 nicht gefunden";
    case 51: return "Leitkabel 2 nicht gefunden";
    case 52: return "Leitkabel 3 nicht gefunden";
    case 53: return "GPS-Navigationsproblem";
    case 54: return "GPS-Signal zu schwach";
    case 55: return "Heimfindung schwierig";
    case 56: return "Leitkalibrierung abgeschlossen";
    case 57: return "Leitkalibrierung fehlgeschlagen";
    case 58: return "GPS Navigationsproblem";
    case 59: return "GPS Signal schwach"; 
    case 60: return "Problem Ladestation zu finden";
    case 61: return "Führungscalibrierung beendet";
    case 62: return "Führungskalibrierung fehlgeschlagen";
    case 63: return "Vorübergehendes Batterieproblem";
    case 64: return "Vorübergehendes Batterieproblem";
    case 65: return "Vorübergehendes Batterieproblem";
    case 66: return "Batterieproblem";
    case 67: return "Batterieproblem";
    case 68: return "Vorübergehendes Batterieproblem";
    case 69: return "Alarm! Mäher wurde ausgeschaltet";
    case 70: return "Alarm! Mäher gestoppt";
    case 71: return "Alarm! Mäher angehoben";
    case 72: return "Alarm! Mäher geneigt";
    case 73: return "Alarm! Mäher in Bewegung";
    case 74: return "Alarm! Außerhalb des Geozauns";
    case 75: return "Verbindung geändert";
    case 76: return "Verbindung NICHT geändert";
    case 77: return "Kommunikationsmodul nicht verfügbar";
    case 78: return "Gerutscht – Problem nicht durch Bewegungsmuster gelöst";
    case 79: return "Ungültige Batteriekombination";
    case 80: return "Unwucht im Schneidsystem (Warnung)";
    case 81: return "Sicherheitsfunktion fehlerhaft";
    case 82: return "Radmotor blockiert hinten rechts";
    case 83: return "Radmotor blockiert hinten links";
    case 84: return "Problem mit Radantrieb hinten rechts";
    case 85: return "Problem mit Radantrieb hinten links";
    case 86: return "Radmotor überlastet hinten rechts";
    case 87: return "Radmotor überlastet hinten links";
    case 88: return "Problem mit dem Winkelsensor";
    case 89: return "Ungültige Systemkonfiguration";
    case 90: return "Kein Strom in der Ladestation";
    default: return "Unbekannter Fehlercode";
  }
},

  getDom() {
  const wrapper = document.createElement("div");

  if (!this.mowerData) {
    wrapper.innerText = "Lade Mäherdaten...";
    return wrapper;
  }

  const mower = this.mowerData.data?.[0];

  if (mower) {
    const name = mower.attributes.system.name;
    const mode = mower.attributes.mower.mode;
    const activity = mower.attributes.mower.activity;
    const state = mower.attributes.mower.state;
    const errorCode = mower.attributes.mower.errorCode;
    const battery = Number(mower.attributes.battery.batteryPercent).toFixed(2);
    const Gesamtzeit = mower.attributes.statistics.totalRunningTime / 60 / 60;
    const Suchzeit = Number(mower.attributes.statistics.totalSearchingTime * 100 / mower.attributes.statistics.totalRunningTime).toFixed(2);
    const Schneidezeit = Number(mower.attributes.statistics.totalCuttingTime * 100 / mower.attributes.statistics.totalRunningTime).toFixed(2);
    const Strecke = mower.attributes.statistics.totalDriveDistance / 1000;
    const Geschwindigkeit = Number(Strecke / Gesamtzeit).toFixed(2);

    let html = `<strong><i class="fas fa-solid fa-fan"></i> ${name}</strong><br>`;

    if (this.config.showActivity) {
      let mode_ger;
      let activityIcon = '<i class="fas fa-question-circle"></i> ';

      switch (activity) {
        case "MOWING":
          mode_ger = "mäht";
          activityIcon = '<i class="fas fa-cut"></i> ';
          break;
        case "GOING_HOME":
          mode_ger = "auf dem Heimweg";
          activityIcon = '<i class="fas fa-home"></i> ';
          break;
        case "CHARGING":
          mode_ger = "lädt";
          activityIcon = '<i class="fa-solid fa-plug-circle-bolt"></i> ';
          break;
        case "LEAVING":
          mode_ger = "verlässt Ladestation";
          activityIcon = '<i class="fas fa-sign-out-alt"></i> ';
          break;
        case "PARKED_IN_CS":
          mode_ger = "geparkt";
          activityIcon = '<i class="fas fa-parking"></i> ';
          break;
        case "STOPPED_IN_GARDEN":
          mode_ger = "steht im Garten";
          activityIcon = '<i class="fas fa-stop"></i> ';
          break;
        default:
          mode_ger = "Unbekannt";
      }

      html += `<i class="fa-solid fa-circle-info"></i> <i class="fa-solid fa-house-signal"></i> &ensp; ${activityIcon}<br>`;

      if (errorCode > 0) {
		
        html += `<i class="fas fa-exclamation-triangle"></i> Status: ${state}<br>`;
		if(this.config.showError_as_Text) {
		  const errorMessage = this.getErrorMessage(errorCode);  	
		  html += `<i class="fas fa-bug"></i> Fehlercode: ${errorMessage}<br>`;
		}
		else{
		  html += `<i class="fas fa-bug"></i> Fehlercode: ${errorCode}<br>`;
		}
      }
    }

    if (this.config.showBattery) {
      html += `<i class="fas fa-battery-half"></i> ${battery}%<br>`;
    }

    if (this.config.showCharging) {
      const chargingTime = (mower.attributes.statistics.totalChargingTime / 60 / 60).toFixed(1);
      const chargingCycles = mower.attributes.statistics.numberOfChargingCycles;
      html += `<i class="fa-solid fa-charging-station"></i> ${chargingTime}h  <i class="fa-solid fa-arrows-spin"></i> ${chargingCycles} <br>`;
    }

    if (this.config.showTime) {
      html += `<i class="fa-solid fa-stopwatch"></i> ${Gesamtzeit.toFixed(1)}h | &ensp; <i class="fas fa-solid fa-fan"></i> ${Schneidezeit}% <i class="fas fa-solid fa-magnifying-glass-location"></i> ${Suchzeit}% <br>`;
    }

    if (this.config.showDistance) {
      html += `<i class="fas fa-road-circle-check"></i> ${Strecke.toFixed(1)}km  <i class="fa-solid fa-gauge-high"></i> ${Geschwindigkeit}km/h<br>`;
    }

    wrapper.innerHTML = html;
  } else {
    wrapper.innerText = "Kein Mäher gefunden.";
  }

  return wrapper;
  },
});
