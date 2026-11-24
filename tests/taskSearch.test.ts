import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildTaskSearch,
  SearchSyntaxError,
} from "../src/services/taskSearch.js";
interface SampleTask {
  id: string;
  owner: string;
  title: string;
  description: string;
  completed: boolean;
  category?: string;
  dueDate?: string;
}
const data: SampleTask[] = [
  {
    id: "1",
    owner: "alice",
    title: "Website Update",
    description: "Project report",
    completed: false,
    category: "Urgent",
    dueDate: "2026-12-10",
  },
  {
    id: "2",
    owner: "alice",
    title: "Team meeting",
    description: "Website update review",
    completed: true,
    category: "Important",
    dueDate: "2026-12-20",
  },
  {
    id: "3",
    owner: "alice",
    title: "a.*+[x]",
    description: "old task",
    completed: false,
    category: "Important",
    dueDate: "",
  },
  {
    id: "4",
    owner: "bob",
    title: "Website Update",
    description: "Project report",
    completed: false,
    category: "Urgent",
    dueDate: "2026-12-10",
  },
  {
    id: "5",
    owner: "alice",
    title: "Legacy task",
    description: "no due date",
    completed: false,
  },
];
function record(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value));
  return value as Record<string, unknown>;
}
function matches(task: SampleTask, clause: Record<string, unknown>): boolean {
  return Object.entries(clause).every(([field, value]) => {
    if (field === "$and" || field === "$or" || field === "$nor") {
      assert.ok(Array.isArray(value));
      const clauses = value.map(record);
      if (field === "$and") return clauses.every((child) => matches(task, child));
      if (field === "$or") return clauses.some((child) => matches(task, child));
      return !clauses.some((child) => matches(task, child));
    }
    const actual: unknown = Object.prototype.hasOwnProperty.call(task, field)
      ? task[field as keyof SampleTask] : undefined;
    if (!value || typeof value !== "object") return actual === value;
    const operators = record(value);
    if ("$regex" in operators) {
      assert.equal(typeof operators.$regex, "string");
      assert.equal(typeof operators.$options, "string");
      return new RegExp(operators.$regex as string, operators.$options as string).test(typeof actual === "string" ? actual : "");
    }
    return Object.entries(operators).every(([operator, expected]) => {
      if (operator === "$exists") return (actual !== undefined) === expected;
      if (operator === "$ne") return actual !== expected;
      if (operator === "$lt" || operator === "$gt") {
        if (typeof actual !== "string" || typeof expected !== "string") return false;
        return operator === "$lt" ? actual < expected : actual > expected;
      }
      assert.fail("Unexpected search operator: " + operator);
    });
  });
}
const find = (query: string) =>
  data
    .filter((task) =>
      matches(task, { owner: "alice", $and: buildTaskSearch(query) }),
    )
    .map((t) => t.id);
const searchCases: [string, string[]][] = [
  ["", ["1", "2", "3", "5"]],
  ["website", ["1", "2"]],
  ["WEBSITE report", ["1"]],
  ['"website update"', ["1", "2"]],
  ['title:"website update"', ["1"]],
  ['description:"website update"', ["2"]],
  ["is:pending tag:urgent website", ["1"]],
  ["is:completed", ["2"]],
  ["tag:IMPORTANT", ["2", "3"]],
  ["-meeting", ["1", "3", "5"]],
  ["-is:completed -tag:urgent", ["3", "5"]],
  ['-"website update"', ["3", "5"]],
  ["after:2026-12-09 before:2026-12-20", ["1"]],
  ["before:2026-12-10", []],
  ["after:2026-12-20", []],
  ["a.*+[x]", ["3"]],
  [".", ["3"]],
  ["is:pending is:completed", []],
  ["https://example.com", []],
];
for (const [query, expected] of searchCases)
  test("search " + JSON.stringify(query), () =>
    assert.deepEqual(find(query), expected),
  );
for (const query of [
  "is:unknown",
  "tag:other",
  "before:2026-02-30",
  "after:invalid",
  "title:",
  '"unclosed phrase',
  'title:"unclosed phrase',
]) {
  test("reject " + JSON.stringify(query), () =>
    assert.throws(() => buildTaskSearch(query), SearchSyntaxError),
  );
}
test("every regex metacharacter is escaped literally", () => {
  for (const value of [
    "\\",
    ".",
    "*",
    "+",
    "?",
    "^",
    "$",
    "{",
    "}",
    "(",
    ")",
    "|",
    "[",
    "]",
  ]) {
    const clauses = buildTaskSearch(value)[0].$or;
    assert.ok(Array.isArray(clauses));
    const regex = record(record(clauses[0]).title);
    assert.equal(typeof regex.$regex, "string");
    assert.equal(typeof regex.$options, "string");
    assert.equal(new RegExp(regex.$regex as string, regex.$options as string).test(value), true);
    assert.equal(
      new RegExp(regex.$regex as string, regex.$options as string).test("unrelated text"),
      false,
    );
  }
});
