import { MarcRecord, MarcDataField, MarcSubfield } from "./types";

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[\s.,;:\/]+$/, "");
}

function ensureEnding(value: string, ending: string): string {
  const stripped = stripTrailingPunctuation(value);
  return stripped + ending;
}

function fix245Punctuation(field: MarcDataField): {
  field: MarcDataField;
  corrected: boolean;
} {
  const subfields = [...field.subfields];
  let corrected = false;

  for (let i = 0; i < subfields.length; i++) {
    const sf = subfields[i];
    const next = subfields[i + 1];
    let newValue = sf.value;

    if (sf.code === "a") {
      if (next?.code === "b") {
        newValue = ensureEnding(sf.value, " :");
      } else if (next?.code === "c") {
        newValue = ensureEnding(sf.value, " /");
      } else if (!next) {
        newValue = ensureEnding(sf.value, ".");
      }
    } else if (sf.code === "b") {
      if (next?.code === "c") {
        newValue = ensureEnding(sf.value, " /");
      } else if (!next) {
        newValue = ensureEnding(sf.value, ".");
      }
    } else if (sf.code === "c") {
      if (!next) {
        newValue = ensureEnding(sf.value, ".");
      }
    }

    if (newValue !== sf.value) {
      subfields[i] = { code: sf.code, value: newValue };
      corrected = true;
    }
  }

  return {
    field: { ...field, subfields },
    corrected,
  };
}

function fix264Punctuation(field: MarcDataField): {
  field: MarcDataField;
  corrected: boolean;
} {
  // Only fix publication fields (ind2 = "1")
  if (field.ind2 !== "1") return { field, corrected: false };

  const subfields = [...field.subfields];
  let corrected = false;

  for (let i = 0; i < subfields.length; i++) {
    const sf = subfields[i];
    const next = subfields[i + 1];
    let newValue = sf.value;

    if (sf.code === "a" && next) {
      newValue = ensureEnding(sf.value, " :");
    } else if (sf.code === "b" && next) {
      newValue = ensureEnding(sf.value, ",");
    } else if (sf.code === "c") {
      newValue = ensureEnding(sf.value, ".");
    }

    if (newValue !== sf.value) {
      subfields[i] = { code: sf.code, value: newValue };
      corrected = true;
    }
  }

  return {
    field: { ...field, subfields },
    corrected,
  };
}

export function fixIsbdPunctuation(record: MarcRecord): {
  record: MarcRecord;
  corrections: string[];
} {
  const corrections: string[] = [];
  const updatedFields = [...record.dataFields];

  for (let i = 0; i < updatedFields.length; i++) {
    const field = updatedFields[i];

    if (field.tag === "245") {
      const result = fix245Punctuation(field);
      if (result.corrected) {
        updatedFields[i] = result.field;
        corrections.push("245 (Title Statement): ISBD punctuation corrected.");
      }
    } else if (field.tag === "264") {
      const result = fix264Punctuation(field);
      if (result.corrected) {
        updatedFields[i] = result.field;
        corrections.push(
          "264 (Publication Info): ISBD punctuation corrected."
        );
      }
    }
  }

  return {
    record: { ...record, dataFields: updatedFields },
    corrections,
  };
}
