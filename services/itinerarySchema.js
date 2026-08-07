/*
We use a schema because we don't want Gemini to return random text.

For our project, the frontend needs an itinerary summary and a list
of activities. Each activity also needs information that we can use
in our app like the title, category, estimated cost, and notes.

So we tell Gemini exactly what structure we want back:
- summary is a string
- activities is an array
- each activity is an object
- each activity has title, category, estimatedCost, and notes

This makes the Gemini response easier for our frontend and backend to use.
*/

// We use Type to define what kind of data Gemini should return.
const { Type } = require("@google/genai");

const itinerarySchema = {
  type: Type.OBJECT,

  properties: {
    summary: {
      type: Type.STRING,
    },

    activities: {
      type: Type.ARRAY,

      items: {
        type: Type.OBJECT,

        properties: {
          title: {
            type: Type.STRING,
          },

          category: {
            type: Type.STRING,
          },

          estimatedCost: {
            type: Type.NUMBER,
          },

          notes: {
            type: Type.STRING,
          },
        },

        // Every activity needs these fields.
        required: [
          "title",
          "category",
          "estimatedCost",
          "notes",
        ],
      },
    },
  },

  // Gemini needs to return both parts of the itinerary.
  required: ["summary", "activities"],
};

module.exports = itinerarySchema;