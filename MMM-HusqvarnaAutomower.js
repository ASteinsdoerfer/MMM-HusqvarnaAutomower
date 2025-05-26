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
        html += `<i class="fas fa-bug"></i> Fehlercode: ${errorCode}<br>`;
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
