const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { GoogleGenAI, Type } = require("@google/genai");

// ---------------------------------------------------------------------------
// FALLBACK
// The visa API has a monthly request limit. When it runs out (or is down) we
// ask Gemini instead, so the page still shows something useful. Every answer
// carries a "source" field — "visa-api" or "gemini" — and the UI must say so,
// because an AI guess is not the same as a licensed visa database.
// ---------------------------------------------------------------------------

const ai = new GoogleGenAI({ apiKey: process.env.MY_TRAVEL_BUDDY });

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

// Same shape the visa API returns, so the frontend reads one format.
const visaSchema = {
  type: Type.OBJECT,
  properties: {
    ruleName: {
      type: Type.STRING,
      description: "e.g. Visa not required, Visa required, Visa on arrival",
    },
    duration: {
      type: Type.STRING,
      description: "How long they may stay, e.g. 90 days. Empty if none.",
    },
    color: {
      type: Type.STRING,
      enum: ["green", "yellow", "red"],
      description: "green = no visa, yellow = on arrival/e-visa, red = visa",
    },
    capital: { type: Type.STRING },
    currency: { type: Type.STRING },
    currencyCode: { type: Type.STRING },
    passportValidity: { type: Type.STRING },
    phoneCode: { type: Type.STRING },
    timezone: { type: Type.STRING, description: "UTC offset, e.g. +01:00" },
  },
  required: [
    "ruleName",
    "color",
    "capital",
    "currency",
    "currencyCode",
    "passportValidity",
    "phoneCode",
    "timezone",
  ],
};

async function askGeminiForVisa(passportCode, destinationCode) {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `Entry requirements for a passport holder of country code ${passportCode} travelling to country code ${destinationCode}. Give the destination's capital, currency, phone code and timezone too.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: visaSchema,
    },
  });

  const answer = JSON.parse(response.text);

  // Rebuild it in the visa API's shape so the frontend needs no special case.
  return {
    source: "gemini",
    data: {
      destination: {
        code: destinationCode,
        capital: answer.capital,
        currency: answer.currency,
        currency_code: answer.currencyCode,
        passport_validity: answer.passportValidity,
        phone_code: answer.phoneCode,
        timezone: answer.timezone,
      },
      visa_rules: {
        primary_rule: {
          name: answer.ruleName,
          duration: answer.duration,
          color: answer.color,
        },
      },
    },
  };
}

// Country list fallback. Gemini returns the ISO alpha-2 codes and names, which
// is all the dropdowns need.
const countryListSchema = {
  type: Type.OBJECT,
  properties: {
    countries: {
      type: Type.ARRAY,
      description: "Every sovereign country and travel territory.",
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING, description: "ISO alpha-2, e.g. FR" },
          name: { type: Type.STRING },
        },
        required: ["code", "name"],
      },
    },
  },
  required: ["countries"],
};

async function askGeminiForCountries() {
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents:
      "List every country and travel destination territory with its ISO alpha-2 code. Include territories such as Bermuda, Hong Kong, Macau and Puerto Rico. Sort by name.",
    config: {
      responseMimeType: "application/json",
      responseSchema: countryListSchema,
    },
  });

  const answer = JSON.parse(response.text);

  return answer.countries || [];
}

// The country lists never change during a run, so we fetch them ONCE and keep
// them in memory. Without this, every visit to the Documents tab spent two
// more requests from the monthly API quota.
let countryCache = null;

// This route receives the passport country code
// and destination country code from the frontend.
// The visa API keeps two lists, and they are NOT the same:
//   /v2/passports    -> countries that issue passports (200)
//   /v2/destinations -> places you can travel to (212, includes Bermuda,
//                       Hong Kong, Macau and other territories)
// The frontend asks for them once and fills both dropdowns, so we never have
// to keep a hand-written country list in sync.
router.get("/visa/countries", requireAuth, async (req, res) => {
  const apiKey = process.env.VISA_API;

  if (!apiKey) {
    return res.status(503).json({ error: "Visa API is not configured" });
  }

  const headers = {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": "visa-requirement.p.rapidapi.com",
  };

  // Already fetched during this run? Send the copy we kept.
  if (countryCache) {
    return res.json(countryCache);
  }

  try {
    const [passportsResponse, destinationsResponse] = await Promise.all([
      fetch("https://visa-requirement.p.rapidapi.com/v2/passports", { headers }),
      fetch("https://visa-requirement.p.rapidapi.com/v2/destinations", {
        headers,
      }),
    ]);

    // Out of quota or otherwise failing: get the list from Gemini instead, so
    // the dropdowns are still usable.
    if (!passportsResponse.ok || !destinationsResponse.ok) {
      console.warn("Visa API country list unavailable — using Gemini.");

      const countries = await askGeminiForCountries();

      countryCache = {
        source: "gemini",
        passports: countries,
        destinations: countries,
      };

      return res.json(countryCache);
    }

    const passports = await passportsResponse.json();
    const destinations = await destinationsResponse.json();

    // Send just the two fields the dropdowns need.
    const simplify = (list) =>
      (list || []).map((country) => ({
        code: country.iso_alpha2,
        name: country.name,
      }));

    countryCache = {
      source: "visa-api",
      passports: simplify(passports.data),
      destinations: simplify(destinations.data),
    };

    res.json(countryCache);
  } catch (error) {
    console.error("VISA COUNTRIES ERROR:", error.message);

    try {
      const countries = await askGeminiForCountries();

      countryCache = {
        source: "gemini",
        passports: countries,
        destinations: countries,
      };

      return res.json(countryCache);
    } catch (fallbackError) {
      console.error("GEMINI COUNTRY LIST ERROR:", fallbackError.message);

      return res.status(503).json({ error: "Could not load the country list" });
    }
  }
});

router.post("/visa", requireAuth, async (req, res) => {
  const { passportCode, destinationCode } = req.body;

  // Read the Visa API key from .env.
  const apiKey = process.env.VISA_API;

  if (!apiKey) {
    return res.status(503).json({
      error: "Visa API is not configured",
    });
  }

  try {
    const response = await fetch(
      "https://visa-requirement.p.rapidapi.com/v2/visa/check",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "visa-requirement.p.rapidapi.com",
        },
        body: JSON.stringify({
          passport: passportCode,
          destination: destinationCode,
        }),
      }
    );

    // Out of quota (429) or any other failure: ask Gemini instead of showing
    // the user an error. The answer is tagged so the UI can label it.
    if (!response.ok) {
      console.warn(`Visa API returned ${response.status} — using Gemini.`);

      const fallback = await askGeminiForVisa(passportCode, destinationCode);

      return res.json(fallback);
    }

    const data = await response.json();

    // Tag the real thing too, so the frontend always knows the source.
    res.json({ ...data, source: "visa-api" });
  } catch (error) {
    console.error("VISA ERROR:", error.message);

    // The visa API is unreachable — try Gemini before giving up.
    try {
      const fallback = await askGeminiForVisa(passportCode, destinationCode);

      return res.json(fallback);
    } catch (fallbackError) {
      console.error("GEMINI FALLBACK ERROR:", fallbackError.message);

      return res.status(503).json({
        error: "Visa information is unavailable right now.",
      });
    }
  }
});

module.exports = router;