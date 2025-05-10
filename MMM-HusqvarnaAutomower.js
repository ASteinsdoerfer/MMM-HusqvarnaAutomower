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
    const mode = mower.attributes.mower.mode; //"MAIN_AREA" | "SECONDARY_AREA" | "HOME" | "DEMO" | "UNKNOWN"
    const activity = mower.attributes.mower.activity; //"UNKNOWN" | "NOT_APPLICABLE" | "MOWING" | "GOING_HOME" | "CHARGING" | "LEAVING" | "PARKED_IN_CS" | "STOPPED_IN_GARDEN"
	const state = mower.attributes.mower.state; //  "UNKNOWN" | "NOT_APPLICABLE" | "PAUSED" | "IN_OPERATION" | "WAIT_UPDATING" | "WAIT_POWER_UP" | "RESTRICTED" | "OFF" | "STOPPED" | "ERROR" | "FATAL_ERROR" |"ERROR_AT_POWER_UP",
	const errorCode = mower.attributes.mower.errorCode; 
    const battery = Number(mower.attributes.battery.batteryPercent).toFixed(2);
	const Gesamtzeit = mower.attributes.statistics.totalRunningTime/60/60;
	const Suchzeit = Number(mower.attributes.statistics.totalSearchingTime*100/ mower.attributes.statistics.totalRunningTime).toFixed(2);
	const Schneidezeit = Number(mower.attributes.statistics.totalCuttingTime*100/mower.attributes.statistics.totalRunningTime).toFixed(2);
	const Strecke = mower.attributes.statistics.totalDriveDistance/1000;
	const Geschwindigkeit = Number(Strecke/Gesamtzeit).toFixed(2);  
 
	  
    let html = `
	  
      <strong>${name}</strong><br>
      
    `;

	if (this.config.showActivity) {

      let mode_ger;  
	  
			
	  switch(activity){
		case "UNKNOWN":
		  mode_ger = "Unbekannt";
		  break;
		case "NOT_APPLICABLE":
		  mode_ger = "nicht anwendbar";
		  break;
		case "MOWING":
		  mode_ger = "mäht";
		  break;
		case "GOING_HOME":
		  mode_ger = "auf dem Heimweg";
		  break;
		case "CHARGING":
		  mode_ger = "lädt";
		  break;
		case "LEAVING":
		  mode_ger = "verlässt Ladestation";
		  break;
		case "PARKED_IN_CS":
		  mode_ger = "geparkt";
		  break;
		case "STOPPED_IN_GARDEN":
		  mode_ger = "steht im Garten";
		  break;		  
	  } 

      html += `Aktivität: ${mode_ger}<br>`;
    
	  if(errorCode>0)  {
	        html += `Staus: ${state}<br>`;
	        html += `Fehlercode: ${errorCode}<br>`;			
	  }		  
	
	}

    if (this.config.showBattery) {
      html += `Batterie: ${battery}% <br>`;
    }

	if (this.config.showCharging) {
      html += `Ladedauer: ${mower.attributes.statistics.totalChargingTime/60/60}h bei ${mower.attributes.statistics.numberOfChargingCycles} Zyklen<br>`;
    }

    if (this.config.showTime) {
      html += `Gesamtfahrzeit: ${Gesamtzeit}h | Suchen ${Suchzeit}% Mähen ${Schneidezeit}% <br>`;
    }

    if (this.config.showDistance) {
      html += `Fahrstrecke: ${Strecke}km bei ${Geschwindigkeit}km/h<br>`;
    }



    wrapper.innerHTML = html;

  } else {
    wrapper.innerText = "Kein Mäher gefunden.";
  }

  return wrapper;
  },
});
