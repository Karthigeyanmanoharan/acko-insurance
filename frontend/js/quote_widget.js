// frontend/js/quote_widget.js
// Module 2 — Inline quote form. Loaded by home.html after home.js.

// ---------------------------------------------------------------------------
// Vehicle data (make → models)
// ---------------------------------------------------------------------------
const BIKE_MODELS = {
  "Ampere":        ["Magnus","Reo","Zeal"],
  "Ather Energy":  ["450S","450X","Rizta"],
  "Bajaj":         ["Avenger 160","Avenger 220","CT100","Dominar 400","Platina 100","Pulsar 125","Pulsar 150","Pulsar 220","Pulsar NS200","RS200"],
  "Bounce":        ["Infinity E1"],
  "Hero MotoCorp": ["Destini 125","Glamour","HF Deluxe","Maestro Edge 125","Passion Pro","Splendor Plus","Xtreme 160R"],
  "Honda":         ["Activa 125","Activa 6G","Africa Twin","Aviator","CB Hornet 2.0","CB350","CB500X","Dio","Grazia 125","Shine","SP125","SP160","Unicorn","X-Blade"],
  "KTM":           ["200 Duke","250 Adventure","250 Duke","390 Adventure","390 Duke","RC 200","RC 390"],
  "Kawasaki":      ["Ninja 300","Ninja 400","Ninja 650","Versys 650","Z650","Z900"],
  "Ola Electric":  ["S1","S1 Air","S1 Pro","S1 X"],
  "Royal Enfield": ["Bullet 350","Classic 350","Himalayan","Hunter 350","Interceptor 650","Meteor 350","Scram 411","Thunderbird 350X"],
  "Suzuki":        ["Access 125","Avenis 125","Burgman Street","Gixxer 150","Gixxer 250","Hayabusa","V-Strom SX"],
  "TVS":           ["Apache RTR 160","Apache RTR 200","Apache RR 310","iQube","Jupiter","Ntorq 125","Raider","Ronin","Star City Plus","XL100"],
  "Yamaha":        ["Aerox 155","Fascino 125","FZ-S V3","FZ-X","MT-03","MT-15","R15 V4","Ray ZR 125","Saluto 125"],
};

const CAR_MODELS = {
  "Audi":           ["A3","A4","A6","A8","Q2","Q3","Q5","Q7","Q8"],
  "BMW":            ["1 Series","2 Series Gran Coupe","3 Series","5 Series","X1","X3","X5","X7"],
  "BYD":            ["Atto 3","Seal","Sealion 6"],
  "Ford":           ["Aspire","EcoSport","Endeavour","Figo"],
  "Honda":          ["Accord","Amaze","City","City Hybrid","CR-V","Elevate","Jazz","WR-V"],
  "Hyundai":        ["Alcazar","Aura","Creta","Creta Electric","Grand i10 Nios","i20","Ioniq 5","Tucson","Venue","Verna"],
  "Jeep":           ["Compass","Meridian","Wrangler"],
  "Kia":            ["Carens","Carnival","EV6","Seltos","Sonet"],
  "MG":             ["Astor","Comet EV","Gloster","Hector","Windsor EV","ZS EV"],
  "Mahindra":       ["Bolero","Scorpio","Scorpio N","Thar","Thar Roxx","XUV 3XO","XUV300","XUV400","XUV700"],
  "Maruti Suzuki":  ["Alto K10","Baleno","Brezza","Celerio","Ciaz","Dzire","Ertiga","Fronx","Grand Vitara","Ignis","S-Presso","Swift","XL6"],
  "Mercedes-Benz":  ["A-Class Limousine","C-Class","CLA","E-Class","EQB","EQS","G-Class","GLA","GLC","GLE","S-Class"],
  "Nissan":         ["Kicks","Magnite"],
  "Renault":        ["Duster","Kiger","Kwid","Triber"],
  "Skoda":          ["Kushaq","Octavia","Slavia","Superb"],
  "Tata":           ["Altroz","Curvv","Curvv EV","Harrier","Nexon","Nexon EV","Punch","Punch EV","Safari","Tiago","Tiago EV","Tigor"],
  "Toyota":         ["Camry","Fortuner","Glanza","Innova Crysta","Innova HyCross","Land Cruiser","Urban Cruiser Taisor"],
  "Volkswagen":     ["Polo","Taigun","Tiguan","Vento","Virtus"],
};

const BIKE_VARIANTS = ["STD","Deluxe","ABS","BS6","BS6+","Disc","Drum","Sport","Pro","Smart Key","DRL","Bluetooth","Double Disc","Special Edition","Limited Edition","Standard"];
const CAR_VARIANTS  = ["Base","VX","VXi","ZX","ZXi","AT","MT","AMT","AWD","4WD","Hybrid","Plus","Premium","Sport","Luxury","LX","EX","EV","Pro","Elite","Smart"];

const CITIES = [
  "Agra","Ahmedabad","Amritsar","Bengaluru","Bhopal","Bhubaneswar",
  "Chandigarh","Chennai","Coimbatore","Delhi","Faridabad","Gandhinagar",
  "Ghaziabad","Gurugram","Guwahati","Hyderabad","Indore","Jaipur",
  "Jalandhar","Kanpur","Kochi","Kolkata","Lucknow","Ludhiana",
  "Madurai","Mangalore","Meerut","Mumbai","Mysuru","Nagpur",
  "Nashik","Navi Mumbai","Noida","Patna","Pune","Raipur",
  "Rajkot","Ranchi","Surat","Thane","Thiruvananthapuram",
  "Vadodara","Varanasi","Vijayawada","Visakhapatnam",
];

const CITY_INFO = {
  "Agra":{"tier":2,"risk":1.18,"state":"Uttar Pradesh"},
  "Ahmedabad":{"tier":1,"risk":1.30,"state":"Gujarat"},
  "Amritsar":{"tier":2,"risk":1.10,"state":"Punjab"},
  "Bengaluru":{"tier":1,"risk":1.28,"state":"Karnataka"},
  "Bhopal":{"tier":2,"risk":1.05,"state":"Madhya Pradesh"},
  "Bhubaneswar":{"tier":2,"risk":1.05,"state":"Odisha"},
  "Chandigarh":{"tier":2,"risk":1.12,"state":"Chandigarh"},
  "Chennai":{"tier":1,"risk":1.22,"state":"Tamil Nadu"},
  "Coimbatore":{"tier":2,"risk":1.05,"state":"Tamil Nadu"},
  "Delhi":{"tier":1,"risk":1.40,"state":"Delhi"},
  "Faridabad":{"tier":1,"risk":1.30,"state":"Haryana"},
  "Gandhinagar":{"tier":2,"risk":1.10,"state":"Gujarat"},
  "Ghaziabad":{"tier":1,"risk":1.32,"state":"Uttar Pradesh"},
  "Gurugram":{"tier":1,"risk":1.35,"state":"Haryana"},
  "Guwahati":{"tier":2,"risk":1.05,"state":"Assam"},
  "Hyderabad":{"tier":1,"risk":1.25,"state":"Telangana"},
  "Indore":{"tier":2,"risk":1.10,"state":"Madhya Pradesh"},
  "Jaipur":{"tier":2,"risk":1.12,"state":"Rajasthan"},
  "Jalandhar":{"tier":2,"risk":1.10,"state":"Punjab"},
  "Kanpur":{"tier":2,"risk":1.10,"state":"Uttar Pradesh"},
  "Kochi":{"tier":2,"risk":1.08,"state":"Kerala"},
  "Kolkata":{"tier":1,"risk":1.28,"state":"West Bengal"},
  "Lucknow":{"tier":2,"risk":1.12,"state":"Uttar Pradesh"},
  "Ludhiana":{"tier":2,"risk":1.12,"state":"Punjab"},
  "Madurai":{"tier":2,"risk":1.05,"state":"Tamil Nadu"},
  "Mangalore":{"tier":2,"risk":1.00,"state":"Karnataka"},
  "Meerut":{"tier":2,"risk":1.10,"state":"Uttar Pradesh"},
  "Mumbai":{"tier":1,"risk":1.40,"state":"Maharashtra"},
  "Mysuru":{"tier":2,"risk":1.05,"state":"Karnataka"},
  "Nagpur":{"tier":2,"risk":1.08,"state":"Maharashtra"},
  "Nashik":{"tier":2,"risk":1.05,"state":"Maharashtra"},
  "Navi Mumbai":{"tier":1,"risk":1.35,"state":"Maharashtra"},
  "Noida":{"tier":1,"risk":1.32,"state":"Uttar Pradesh"},
  "Patna":{"tier":2,"risk":1.10,"state":"Bihar"},
  "Pune":{"tier":1,"risk":1.22,"state":"Maharashtra"},
  "Raipur":{"tier":2,"risk":1.00,"state":"Chhattisgarh"},
  "Rajkot":{"tier":2,"risk":1.08,"state":"Gujarat"},
  "Ranchi":{"tier":2,"risk":1.00,"state":"Jharkhand"},
  "Surat":{"tier":2,"risk":1.12,"state":"Gujarat"},
  "Thane":{"tier":1,"risk":1.30,"state":"Maharashtra"},
  "Thiruvananthapuram":{"tier":2,"risk":1.05,"state":"Kerala"},
  "Vadodara":{"tier":2,"risk":1.10,"state":"Gujarat"},
  "Varanasi":{"tier":2,"risk":1.08,"state":"Uttar Pradesh"},
  "Vijayawada":{"tier":2,"risk":1.05,"state":"Andhra Pradesh"},
  "Visakhapatnam":{"tier":2,"risk":1.08,"state":"Andhra Pradesh"},
};

const HEALTH_STATES = [
  "Andhra Pradesh","Delhi","Gujarat","Haryana","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Odisha","Punjab",
  "Rajasthan","Tamil Nadu","Telangana","Uttar Pradesh","West Bengal",
];

// ---------------------------------------------------------------------------
// Override the stub in home.js — this is the REAL showQuoteForm
// ---------------------------------------------------------------------------
function showQuoteForm(type, chatWindow, welcomeCard) {
  if (welcomeCard) welcomeCard.style.display = "none";

  const wrapper = document.createElement("div");
  wrapper.className = "qw-wrapper";

  if (type === "health") {
    wrapper.innerHTML = buildHealthForm();
  } else {
    wrapper.innerHTML = buildVehicleForm(type);
  }

  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Wire cascading make → model dropdown
  if (type !== "health") {
    const makeSelect  = wrapper.querySelector("[name='vehicle_make']");
    const modelSelect = wrapper.querySelector("[name='vehicle_model']");
    const models = type === "bike" ? BIKE_MODELS : CAR_MODELS;

    makeSelect.addEventListener("change", () => {
      const opts = models[makeSelect.value] || [];
      modelSelect.innerHTML = opts.length
        ? opts.map(m => `<option value="${m}">${m}</option>`).join("")
        : `<option value="">Select make first</option>`;
    });
  }

  // Wire form submit
  const form = wrapper.querySelector(".qw-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await handleQuoteSubmit(wrapper, type);
  });
}

// ---------------------------------------------------------------------------
// Build bike / car form HTML
// ---------------------------------------------------------------------------
function buildVehicleForm(type) {
  const isBike = type === "bike";
  const makes  = Object.keys(isBike ? BIKE_MODELS : CAR_MODELS);

  return `
  <div class="qw-card">
    <div class="qw-header">
      <span class="qw-icon">${isBike ? "🛵" : "🚗"}</span>
      <div>
        <div class="qw-title">${isBike ? "Bike" : "Car"} Insurance Quote</div>
        <div class="qw-subtitle">Fill in details for an instant AI estimate</div>
      </div>
    </div>
    <form class="qw-form">

      <div class="qw-row">
        <div class="qw-group">
          <label>Your Age</label>
          <input type="number" name="customer_age" min="18" max="80" placeholder="e.g. 30" required />
        </div>
        <div class="qw-group">
          <label>City</label>
          <select name="city" required>
            <option value="">Select city</option>
            ${CITIES.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Make (Brand)</label>
          <select name="vehicle_make" required>
            <option value="">Select make</option>
            ${makes.map(m => `<option value="${m}">${m}</option>`).join("")}
          </select>
        </div>
        <div class="qw-group">
          <label>Model</label>
          <select name="vehicle_model" required>
            <option value="">Select make first</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Variant</label>
          <select name="variant" required>
            ${(isBike ? BIKE_VARIANTS : CAR_VARIANTS).map(v => `<option value="${v}">${v}</option>`).join("")}
          </select>
        </div>
        <div class="qw-group">
          <label>Manufacturing Year</label>
          <input type="number" name="manufacturing_year" min="2000" max="2026"
                 placeholder="e.g. 2020" required />
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Engine CC</label>
          <input type="number" name="engine_cc" min="50" max="8000"
                 placeholder="${isBike ? "e.g. 125" : "e.g. 1197"}" required />
        </div>
        <div class="qw-group">
          <label>IDV — Market Value (₹)</label>
          <input type="number" name="idv" min="10000" max="10000000"
                 placeholder="${isBike ? "e.g. 80000" : "e.g. 600000"}" required />
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Fuel Type</label>
          <select name="fuel_type" required>
            ${isBike
              ? `<option value="Petrol">Petrol</option>
                 <option value="Electric">Electric</option>`
              : `<option value="Petrol">Petrol</option>
                 <option value="Diesel">Diesel</option>
                 <option value="CNG">CNG</option>
                 <option value="Electric">Electric</option>
                 <option value="Hybrid">Hybrid</option>
                 <option value="LPG">LPG</option>`
            }
          </select>
        </div>
        <div class="qw-group">
          <label>Segment</label>
          <select name="segment" required>
            ${isBike
              ? `<option value="scooter">Scooter</option>
                 <option value="commuter">Commuter</option>
                 <option value="sport">Sport</option>
                 <option value="cruiser">Cruiser</option>
                 <option value="adventure">Adventure</option>
                 <option value="retro">Retro</option>
                 <option value="ev_scooter">EV Scooter</option>
                 <option value="moped">Moped</option>
                 <option value="naked">Naked</option>
                 <option value="tourer">Tourer</option>`
              : `<option value="hatchback">Hatchback</option>
                 <option value="sedan">Sedan</option>
                 <option value="suv">SUV</option>
                 <option value="mpv">MPV</option>
                 <option value="ev">EV</option>
                 <option value="hybrid">Hybrid</option>`
            }
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Policy Type</label>
          <select name="policy_type" required>
            <option value="Comprehensive">Comprehensive</option>
            <option value="Own Damage">Own Damage</option>
            <option value="Third Party">Third Party</option>
          </select>
        </div>
        <div class="qw-group">
          <label>No Claim Bonus %</label>
          <select name="ncb_percent">
            <option value="0">0% — No bonus</option>
            <option value="20">20%</option>
            <option value="25">25%</option>
            <option value="35">35%</option>
            <option value="45">45%</option>
            <option value="50">50% — Maximum</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Previous Claims</label>
          <select name="claim_history_count">
            <option value="0">0 — None</option>
            <option value="1">1 claim</option>
            <option value="2">2 claims</option>
            <option value="3">3+ claims</option>
          </select>
        </div>
        <div class="qw-group">
          <label>Zero Depreciation</label>
          <select name="addon_zero_depreciation">
            <option value="0">No</option>
            <option value="1">Yes (+₹)</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Engine Protection</label>
          <select name="addon_engine_protection">
            <option value="0">No</option>
            <option value="1">Yes (+₹)</option>
          </select>
        </div>
        <div class="qw-group">
          <label>Roadside Assistance</label>
          <select name="addon_roadside_assistance">
            <option value="0">No</option>
            <option value="1">Yes (+₹)</option>
          </select>
        </div>
      </div>

      <button type="submit" class="qw-submit-btn">
        Get My Quote →
      </button>
    </form>
  </div>`;
}

// ---------------------------------------------------------------------------
// Build health form HTML
// ---------------------------------------------------------------------------
function buildHealthForm() {
  return `
  <div class="qw-card">
    <div class="qw-header">
      <span class="qw-icon">🩺</span>
      <div>
        <div class="qw-title">Health Insurance Quote</div>
        <div class="qw-subtitle">Instant premium estimate for you and your family</div>
      </div>
    </div>
    <form class="qw-form">

      <div class="qw-row">
        <div class="qw-group">
          <label>Your Age</label>
          <input type="number" name="age" min="18" max="99" placeholder="e.g. 35" required />
        </div>
        <div class="qw-group">
          <label>Gender</label>
          <select name="gender">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Number of Members</label>
          <input type="number" name="num_members" min="1" max="10" placeholder="e.g. 4" required />
        </div>
        <div class="qw-group">
          <label>State</label>
          <select name="state" required>
            <option value="">Select state</option>
            ${HEALTH_STATES.map(s => `<option value="${s}">${s}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Plan Name</label>
          <select name="plan_name" required>
            <option value="Individual Basic">Individual Basic</option>
            <option value="Individual Standard">Individual Standard</option>
            <option value="Individual Premium">Individual Premium</option>
            <option value="Family Floater Basic">Family Floater Basic</option>
            <option value="Family Floater Standard">Family Floater Standard</option>
            <option value="Family Floater Premium">Family Floater Premium</option>
            <option value="Senior Citizen">Senior Citizen</option>
            <option value="Critical Illness">Critical Illness</option>
            <option value="Super Top-Up">Super Top-Up</option>
          </select>
        </div>
        <div class="qw-group">
          <label>Plan Category</label>
          <select name="plan_category" required>
            <option value="Individual">Individual</option>
            <option value="Family">Family Floater</option>
            <option value="Senior">Senior Citizen</option>
            <option value="Specialty">Specialty</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Sum Insured (₹)</label>
          <select name="sum_insured" required>
            <option value="300000">₹3 Lakh</option>
            <option value="500000">₹5 Lakh</option>
            <option value="750000">₹7.5 Lakh</option>
            <option value="1000000">₹10 Lakh</option>
            <option value="2000000">₹20 Lakh</option>
            <option value="5000000">₹50 Lakh</option>
          </select>
        </div>
        <div class="qw-group">
          <label>City Tier</label>
          <select name="city_tier" required>
            <option value="1">Tier 1 — Metro</option>
            <option value="2">Tier 2 — City</option>
            <option value="3">Tier 3 — Town</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>BMI Category</label>
          <select name="bmi_category">
            <option value="Normal">Normal</option>
            <option value="Overweight">Overweight</option>
            <option value="Obese">Obese</option>
          </select>
        </div>
        <div class="qw-group">
          <label>Policy Tenure</label>
          <select name="policy_tenure">
            <option value="1">1 Year</option>
            <option value="2">2 Years</option>
            <option value="3">3 Years</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Smoker?</label>
          <select name="smoke">
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </div>
        <div class="qw-group">
          <label>Pre-existing Condition?</label>
          <select name="has_pre_existing">
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Annual Checkup?</label>
          <select name="annual_checkup">
            <option value="0">No</option>
            <option value="1">Yes (discount)</option>
          </select>
        </div>
        <div class="qw-group">
          <label>NCB Years</label>
          <input type="number" name="ncb_years" min="0" max="10" value="0" />
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Dental/Vision Add-on</label>
          <select name="addon_dental_vision">
            <option value="0">No</option>
            <option value="1">Yes (+₹)</option>
          </select>
        </div>
        <div class="qw-group">
          <label>Critical Illness Rider</label>
          <select name="addon_critical_illness_rider">
            <option value="0">No</option>
            <option value="1">Yes (+₹)</option>
          </select>
        </div>
      </div>

      <div class="qw-row">
        <div class="qw-group">
          <label>Deductible</label>
            <input type="number" name="idv" min="0" max="10000000" required/>
        </div>
        <div class="qw-group">
          <label>Has maternity</label>
          <select name="has_meternity">
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </div>
      </div>



      <button type="submit" class="qw-submit-btn">
        Get My Quote →
      </button>
    </form>
  </div>`;
}

// ---------------------------------------------------------------------------
// Handle form submit — calls the backend API
// ---------------------------------------------------------------------------
async function handleQuoteSubmit(wrapper, type) {
  const form = wrapper.querySelector(".qw-form");
  const btn  = wrapper.querySelector(".qw-submit-btn");
  const data = Object.fromEntries(new FormData(form));

  btn.disabled = true;
  btn.textContent = "Calculating...";

  // Remove any previous errors
  wrapper.querySelectorAll(".qw-error").forEach(e => e.remove());

  // Build payload
  let payload  = {};
  let endpoint = `${API_BASE}/quote/${type}`;

  if (type === "health") {
    payload = {
      age:                          parseInt(data.age),
      gender:                       data.gender,
      state:                        data.state,
      num_members:                  parseInt(data.num_members),
      city_tier:                    parseInt(data.city_tier),
      plan_name:                    data.plan_name,
      plan_category:                data.plan_category,
      bmi_category:                 data.bmi_category,
      smoke:                        parseInt(data.smoke),
      has_pre_existing:             parseInt(data.has_pre_existing),
      annual_checkup:               parseInt(data.annual_checkup),
      ncb_years:                    parseInt(data.ncb_years || 0),
      sum_insured:                  parseFloat(data.sum_insured),
      deductible:                   0,
      policy_tenure:                parseInt(data.policy_tenure),
      has_maternity:                0,
      has_opd:                      0,
      addon_dental_vision:          parseInt(data.addon_dental_vision || 0),
      addon_critical_illness_rider: parseInt(data.addon_critical_illness_rider || 0),
      addon_hospital_cash:          0,
      addon_international_cover:    0,
      addon_maternity:              0,
      addon_opd_cover:              0,
      addon_personal_accident:      0,
    };
  } else {
    const cityData = CITY_INFO[data.city] || { tier: 2, risk: 1.0, state: "Maharashtra" };
    payload = {
      customer_age:              parseInt(data.customer_age),
      city:                      data.city,
      state:                     cityData.state,
      manufacturing_year:        parseInt(data.manufacturing_year),
      engine_cc:                 parseInt(data.engine_cc),
      idv:                       parseFloat(data.idv),
      vehicle_make:              data.vehicle_make,
      vehicle_model:             data.vehicle_model,
      variant:                   data.variant,
      segment:                   data.segment,
      fuel_type:                 data.fuel_type,
      policy_type:               data.policy_type,
      ncb_percent:               parseInt(data.ncb_percent),
      claim_history_count:       parseInt(data.claim_history_count),
      addon_zero_depreciation:   parseInt(data.addon_zero_depreciation || 0),
      addon_engine_protection:   parseInt(data.addon_engine_protection || 0),
      addon_roadside_assistance: parseInt(data.addon_roadside_assistance || 0),
      // Zero out all remaining addon fields
      addon_consumables_cover:   0,
      addon_return_to_invoice:   0,
    };

    if (type === "bike") {
      payload.addon_pillion_rider_cover = 0;
      payload.addon_unknown             = 0;
    } else {
      payload.addon_key_replacement           = 0;
      payload.addon_no_claim_bonus_protection = 0;
      payload.addon_passenger_cover           = 0;
      payload.addon_personal_accident_cover   = 0;
      payload.addon_tyre_protection           = 0;
    }
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...Session.authHeaders(),
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      showFormError(wrapper, result.detail || "Something went wrong. Please try again.");
      btn.disabled = false;
      btn.textContent = "Get My Quote →";
      return;
    }

    // Replace form with result card
wrapper.innerHTML = buildResultCard(result);

setTimeout(() => {
  const newBtn = wrapper.querySelector(".qw-new-btn");
  if (newBtn) {
    newBtn.addEventListener("click", () => {
      // Clear result and show a fresh form picker
      wrapper.innerHTML = `
        <div class="qw-card">
          <div class="qw-header">
            <span class="qw-icon">💰</span>
            <div>
              <div class="qw-title">Get Another Quote</div>
              <div class="qw-subtitle">Choose insurance type</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;padding:4px 0 8px">
            <button class="quote-type-btn" data-type="bike">🛵 Bike</button>
            <button class="quote-type-btn" data-type="car">🚗 Car</button>
            <button class="quote-type-btn" data-type="health">🩺 Health</button>
          </div>
        </div>`;

      // Wire the type buttons
      wrapper.querySelectorAll(".quote-type-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const type = btn.dataset.type;
          const cw = document.getElementById("chat-window");
          const wc = document.getElementById("welcome-card");
          wrapper.remove();
          showQuoteForm(type, cw, wc);
        });
      });
    });
  }
}, 0);

  } catch (err) {
    showFormError(wrapper, "Could not reach the server. Is the backend running?");
    btn.disabled = false;
    btn.textContent = "Get My Quote →";
    console.error(err);
  }

  document.getElementById("chat-window").scrollTop = 99999;
}

// ---------------------------------------------------------------------------
// Build result card HTML
// ---------------------------------------------------------------------------
function buildResultCard(result) {
  const premium   = result.predicted_premium;
  const monthly   = result.monthly_premium;
  const factors   = result.top_factors || [];
  const typeLabel = result.vehicle_type.charAt(0).toUpperCase() + result.vehicle_type.slice(1);

  const factorsHtml = factors.length ? `
    <div class="qw-factors-label">Key factors affecting your premium</div>
    <div class="qw-factors">
      ${factors.map((f, i) => `
        <div class="qw-factor">
          <div class="qw-factor-rank">${i + 1}</div>
          <div class="qw-factor-name">${f.factor}</div>
          <div class="qw-factor-bar">
            <div class="qw-factor-fill" style="width:${Math.min(f.importance * 3, 100)}%"></div>
          </div>
          <div class="qw-factor-pct">${f.importance}%</div>
        </div>`).join("")}
    </div>` : "";

  return `
  <div class="qw-result">
    <div class="qw-result-top">
      <div class="qw-result-check">✓</div>
      <div>
        <div class="qw-result-title">Your Premium Estimate</div>
        <div class="qw-result-subtitle">${typeLabel} Insurance · Annual</div>
      </div>
    </div>
    <div class="qw-result-amount">
      ₹${premium.toLocaleString("en-IN")}
      <span class="qw-result-monthly">≈ ₹${monthly.toLocaleString("en-IN")}/mo</span>
    </div>
    ${factorsHtml}
    <div class="qw-disclaimer">
      AI-powered estimate based on your inputs. Actual premium from Acko may vary.
    </div>
    <button class="qw-new-btn">Get another quote</button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Show inline error inside the form
// ---------------------------------------------------------------------------
function showFormError(wrapper, msg) {
  const existing = wrapper.querySelector(".qw-error");
  if (existing) existing.remove();
  const err = document.createElement("div");
  err.className = "qw-error";
  err.textContent = msg;
  const form = wrapper.querySelector(".qw-form");
  if (form) form.appendChild(err);
  else wrapper.appendChild(err);
}

// ---------------------------------------------------------------------------
// Intent detection — detects if user wants a quote
// Returns: "bike_quote" | "car_quote" | "health_quote" | "ask_type" | "chat"
// ---------------------------------------------------------------------------
function detectQuoteIntent(message) {
  const msg = message.toLowerCase();

  const quoteWords  = ["quote","premium","cost","price","how much","estimate",
                       "insurance cost","get insured","buy insurance","want insurance",
                       "need insurance","get insurance","insurance for"];
  const bikeWords   = ["bike","motorcycle","scooter","two wheeler","two-wheeler",
                       "activa","pulsar","splendor","apache","enfield","tvs","bajaj",
                       "yamaha","ktm","kawasaki","hero","suzuki bike"];
  const carWords    = ["car","four wheeler","four-wheeler","sedan","suv","hatchback",
                       "city car","swift","innova","nexon","creta","i20","alto","baleno",
                       "fortuner","thar","xuv","maruti","hyundai","tata car","honda car"];
  const healthWords = ["health","medical","hospital","mediclaim","critical illness",
                       "family floater","health insurance","senior","top-up","health cover"];

  const isQuote  = quoteWords.some(k => msg.includes(k));
  const isBike   = bikeWords.some(k => msg.includes(k));
  const isCar    = carWords.some(k => msg.includes(k));
  const isHealth = healthWords.some(k => msg.includes(k));

  if (isHealth) return "health_quote";
  if (isBike)   return "bike_quote";
  if (isCar)    return "car_quote";
  if (isQuote)  return "ask_type";
  return "chat";
}