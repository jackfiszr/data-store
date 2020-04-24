import { fs, path } from "./deps.ts";
import { assertEquals } from "./test_deps.ts";
import { get } from "./get_value.js";

const split = (str) => {
  const segs = str.split(".");
  for (let i = 0; i < segs.length; i++) {
    while (segs[i] && segs[i].slice(-1) === "\\") {
      segs[i] = segs[i].slice(0, -1) + "." + segs.splice(i + 1, 1);
    }
  }
  return segs;
};

export const stem = (filepath) =>
  path.basename(filepath, path.extname(filepath));

export const flatten = (...args) => [].concat.apply([], args);
export const unique = (arr) => arr.filter((ele, i) => arr.indexOf(ele) === i);

export const isEmptyPrimitive = (value) => {
  return value === "" || value === void 0 || value === null;
};

export const del = (obj = {}, prop = "") => {
  if (!prop) return false;
  if (obj.hasOwnProperty(prop)) {
    delete obj[prop];
    return true;
  }
  const segs = split(prop);
  const last = segs.pop();
  const val = segs.length ? get(obj, segs.join(".")) : obj;
  if (isObject(val) && val.hasOwnProperty(last)) {
    delete val[last];
    return true;
  }
};

export const hasOwn = (obj = {}, prop = "") => {
  if (!prop) return false;
  if (obj.hasOwnProperty(prop)) return true;
  const segs = split(prop);
  const last = segs.pop();
  if (!segs.length) return false;
  const val = get(obj, segs.join("."));
  return isObject(val) && val.hasOwnProperty(last);
};

/**
 * Deeply clone plain objects and arrays. We're only concerned with
 * cloning values that are valid in JSON.
 */

export const cloneDeep = (value) => {
  const obj = {};
  switch (typeOf(value)) {
    case "object":
      for (const key of Object.keys(value)) {
        obj[key] = cloneDeep(value[key]);
      }
      return obj;
    case "array":
      return value.map((ele) => cloneDeep(ele));
    default: {
      return value;
    }
  }
};

export const isObject = (value) => typeOf(value) === "object";

export const typeOf = (value) => {
  if (value === null) return "null";
  if (value === void 0) return "undefined";
  if (Array.isArray(value)) return "array";
  if (value instanceof Error) return "error";
  if (value instanceof RegExp) return "regexp";
  if (value instanceof Date) return "date";
  return typeof value;
};

/**
 * Create a directory and any intermediate directories that might exist.
 */

export const mkdir = (dirname, options = {}) => {
  assertEquals(typeof dirname, "string", "expected dirname to be a string");
  if (directoryExists(dirname)) return;

  try {
    Deno.mkdirSync(dirname, { ...options, recursive: true });
  } catch (err) {
    handleError(dirname, err, options);
  }

  return dirname;
};

export const directoryExists = (dirname, strict = true) => {
  const stat = tryStat(dirname);
  if (stat) {
    if (strict && !stat.isDirectory()) {
      throw new Error(`Path exists and is not a directory: "${dirname}"`);
    }
    return true;
  }
  return false;
};

export const handleError = (dirname, err, options = {}) => {
  if (/null bytes/.test(err.message)) throw err;

  const isIgnored = ["EEXIST", "EISDIR", "EPERM"].includes(err.code) &&
    options.fs.statSync(dirname).isDirectory() &&
    path.dirname(dirname) !== dirname;

  if (!isIgnored) {
    throw err;
  }
};

export const tryStat = (filepath) => {
  try {
    return fs.statSync(filepath);
  } catch (err) {
    return null;
  }
};

export const tryUnlink = (filepath) => {
  try {
    Deno.removeSync(filepath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
};
