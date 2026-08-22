import { describe, expect, test } from "vitest";
import {
  canActForCompany,
  canReadStudentResume,
  canViewBundle,
  type PolicyActor,
} from "./access-policy";

const admin: PolicyActor = { role: "admin", companyIds: [] };
const recruiterA: PolicyActor = { role: "recruiter", companyIds: [1] };
const recruiterAB: PolicyActor = { role: "recruiter", companyIds: [1, 2] };
const orphan: PolicyActor = { role: "recruiter", companyIds: [] };
const student: PolicyActor = { role: "student", companyIds: [] };

describe("canActForCompany", () => {
  test("an admin may act for any company", () => {
    expect(canActForCompany(admin, 1)).toBe(true);
    expect(canActForCompany(admin, 999)).toBe(true);
  });

  test("a recruiter may act for their own company", () => {
    expect(canActForCompany(recruiterA, 1)).toBe(true);
  });

  test("a recruiter may NOT act for another company", () => {
    expect(canActForCompany(recruiterA, 2)).toBe(false);
  });

  test("a recruiter with no membership may act for nothing", () => {
    expect(canActForCompany(orphan, 1)).toBe(false);
  });

  test("a recruiter in two companies may act for both, and no third", () => {
    expect(canActForCompany(recruiterAB, 1)).toBe(true);
    expect(canActForCompany(recruiterAB, 2)).toBe(true);
    expect(canActForCompany(recruiterAB, 3)).toBe(false);
  });
});

describe("canReadStudentResume", () => {
  test("an admin may read any resume, even one in no bundle", () => {
    expect(canReadStudentResume(admin, [])).toBe(true);
    expect(canReadStudentResume(admin, [7])).toBe(true);
  });

  test("a recruiter may read a candidate in their own released bundle", () => {
    expect(canReadStudentResume(recruiterA, [1])).toBe(true);
  });

  test("a recruiter may NOT read a candidate belonging only to another company", () => {
    expect(canReadStudentResume(recruiterA, [2])).toBe(false);
  });

  test("a shared candidate is readable by each company that has them", () => {
    expect(canReadStudentResume(recruiterA, [1, 2])).toBe(true);
    expect(
      canReadStudentResume({ role: "recruiter", companyIds: [2] }, [1, 2]),
    ).toBe(true);
  });

  test("a candidate in NO released bundle is unreadable by any recruiter", () => {
    expect(canReadStudentResume(recruiterA, [])).toBe(false);
    expect(canReadStudentResume(recruiterAB, [])).toBe(false);
  });

  test("a recruiter with no membership may read nothing", () => {
    expect(canReadStudentResume(orphan, [1])).toBe(false);
    expect(canReadStudentResume(orphan, [])).toBe(false);
  });
});

describe("canViewBundle", () => {
  const released = { companyId: 1, releasedAt: new Date("2026-03-01") };
  const draft = { companyId: 1, releasedAt: null };

  test("an admin sees drafts and released bundles alike", () => {
    expect(canViewBundle(admin, draft)).toBe(true);
    expect(canViewBundle(admin, released)).toBe(true);
  });

  test("a recruiter sees their own released bundle", () => {
    expect(canViewBundle(recruiterA, released)).toBe(true);
  });

  test("a recruiter NEVER sees a draft, even their own company's", () => {
    expect(canViewBundle(recruiterA, draft)).toBe(false);
  });

  test("a recruiter does not see another company's released bundle", () => {
    expect(
      canViewBundle(recruiterA, { companyId: 2, releasedAt: new Date() }),
    ).toBe(false);
  });
});

describe("fails closed", () => {
  // Guards against a future refactor that treats an empty membership list as
  // "unrestricted" — the classic direction this kind of bug goes.
  test("an empty recruiter membership never grants access anywhere", () => {
    for (const companyId of [0, 1, 2, 42]) {
      expect(canActForCompany(orphan, companyId)).toBe(false);
      expect(canViewBundle(orphan, { companyId, releasedAt: new Date() })).toBe(
        false,
      );
    }
  });
});

/**
 * A student is the default role for any signed-in account, so these are the
 * tests that stop a self-registered account from reading candidate PII.
 */
describe("students are denied everywhere", () => {
  test("a student may not act for any company", () => {
    expect(canActForCompany(student, 1)).toBe(false);
    expect(canActForCompany(student, 999)).toBe(false);
  });

  test("a student may not read any resume", () => {
    expect(canReadStudentResume(student, [])).toBe(false);
    expect(canReadStudentResume(student, [1])).toBe(false);
    expect(canReadStudentResume(student, [1, 2, 3])).toBe(false);
  });

  test("a student may not view any bundle, released or draft", () => {
    expect(canViewBundle(student, { companyId: 1, releasedAt: null })).toBe(false);
    expect(
      canViewBundle(student, { companyId: 1, releasedAt: new Date() }),
    ).toBe(false);
  });

  test("a student carrying a forged companyIds list is still denied", () => {
    const forged: PolicyActor = { role: "student", companyIds: [1, 2, 3] };
    expect(canActForCompany(forged, 1)).toBe(false);
    expect(canReadStudentResume(forged, [1])).toBe(false);
    expect(canViewBundle(forged, { companyId: 1, releasedAt: new Date() })).toBe(false);
  });
});
