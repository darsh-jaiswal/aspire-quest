import { describe, expect, it } from "vitest";
import type { SubmittedValues } from "./actions";
import { validateForReview } from "./client-validation";

const VALID: SubmittedValues = {
  fullName: "Asha Patil",
  phone: "9876543210",
  cgpa: "8.15",
  programme: "B.Tech",
  branch: "CS",
  year: "3rd year",
  focusArea: "aiml",
  skills: "Python, PyTorch",
  consent: true,
};

describe("validateForReview", () => {
  it("passes a fully valid form", () => {
    expect(validateForReview(VALID, true)).toEqual({});
  });

  it("catches the reported bug: a semicolon CGPA is flagged under the field", () => {
    const errors = validateForReview({ ...VALID, cgpa: "8;23" }, true);
    expect(errors.cgpa).toBe("Enter CGPA as a number, e.g. 7.85.");
  });

  it("flags an out-of-range CGPA", () => {
    expect(validateForReview({ ...VALID, cgpa: "11" }, true).cgpa).toMatch(
      /between 0 and 10/,
    );
  });

  it("flags a short or bogus mobile number, but accepts prefixed forms", () => {
    expect(validateForReview({ ...VALID, phone: "12345" }, true).phone).toBeDefined();
    expect(validateForReview({ ...VALID, phone: "1234567890" }, true).phone).toBeDefined();
    expect(validateForReview({ ...VALID, phone: "+919876543210" }, true)).toEqual({});
    expect(validateForReview({ ...VALID, phone: "098765 43210" }, true)).toEqual({});
  });

  it("flags every empty mandatory field with its own message", () => {
    const errors = validateForReview(
      {
        fullName: "",
        phone: "",
        cgpa: "",
        programme: "",
        branch: "",
        year: "",
        focusArea: "",
        skills: "",
        consent: false,
      },
      false,
    );
    for (const field of [
      "fullName",
      "phone",
      "cgpa",
      "programme",
      "branch",
      "year",
      "focusArea",
      "resumeBlobKey",
      "consent",
    ]) {
      expect(errors[field], `${field} should have an error`).toBeTruthy();
    }
    expect(errors.skills).toBeUndefined(); // skills are optional
  });

  it("flags more than 12 skills but allows empty skills", () => {
    const thirteen = Array.from({ length: 13 }, (_, i) => `skill${i}`).join(", ");
    expect(validateForReview({ ...VALID, skills: thirteen }, true).skills).toBe(
      "List at most 12 skills.",
    );
    expect(validateForReview({ ...VALID, skills: "" }, true)).toEqual({});
  });
});
