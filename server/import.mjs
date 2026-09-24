import { COUNTRIES } from './data.mjs';

export const VALID_DEPARTMENTS = new Set([
  'People',
  'Engineering',
  'Learning',
  'Operations',
  'Data',
  'Finance',
  'Talent',
]);
const COUNTRY_CODES = new Map(COUNTRIES.map(([name, code]) => [name, code]));
const REQUIRED = [
  'id',
  'name',
  'email',
  'department',
  'country',
  'countryCode',
  'startDate',
  'manager',
];
const FIELDS = [
  'id',
  'name',
  'initials',
  'role',
  'department',
  'country',
  'countryCode',
  'location',
  'email',
  'status',
  'manager',
  'startDate',
];
const ALIASES = {
  employeeid: 'id',
  fullname: 'name',
  employeename: 'name',
  workemail: 'email',
  companyemail: 'email',
  jobtitle: 'role',
  title: 'role',
  division: 'department',
  managername: 'manager',
  employmentstatus: 'status',
  hiredate: 'startDate',
};
const NORMALIZED = new Map(FIELDS.map((field) => [field.toLowerCase(), field]));
const normalizeHeader = (value) => value.toLowerCase().replace(/[ _-]/g, '');

export function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export class CsvError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function parseCsv(text) {
  if (typeof text !== 'string' || !text.trim())
    throw new CsvError('Provide a CSV string with a header and at least one record.');
  if (Buffer.byteLength(text, 'utf8') > 256 * 1024)
    throw new CsvError('CSV input exceeds the 256 KB preview limit.', 413);
  const input = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [],
    field = '',
    quoted = false,
    started = false,
    closed = false;
  const finishField = () => {
    if (field.length > 2000) throw new CsvError('A CSV field exceeds the 2,000-character limit.');
    row.push(field);
    field = '';
    started = false;
    closed = false;
    if (row.length > 32) throw new CsvError('CSV input exceeds the 32-column preview limit.');
  };
  const finishRow = () => {
    finishField();
    if (row.some((cell) => cell.trim())) rows.push(row);
    row = [];
    if (rows.length > 501) throw new CsvError('CSV input exceeds the 500-record preview limit.');
  };
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (quoted) {
      if (character === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += character;
      continue;
    }
    if (character === ',') {
      finishField();
      continue;
    }
    if (character === '\r' || character === '\n') {
      if (character === '\r' && input[i + 1] === '\n') i += 1;
      finishRow();
      continue;
    }
    if (closed)
      throw new CsvError('Unexpected text after a closing CSV quote. Use a comma or a new line.');
    if (character === '"') {
      if (started) throw new CsvError('A quote inside an unquoted CSV field must be escaped.');
      quoted = true;
      started = true;
      continue;
    }
    field += character;
    started = true;
  }
  if (quoted) throw new CsvError('CSV contains an unclosed quoted field.');
  if (field || row.length || started || closed) finishRow();
  if (rows.length < 2) throw new CsvError('Provide a CSV header and at least one nonempty record.');
  return rows;
}

export function previewImport(csv, existingEmployees = []) {
  const [headers, ...records] = parseCsv(csv);
  const errors = [];
  const problem = (row, field, message, severity = 'error') =>
    errors.push({ row, field, message, severity });
  const mappings = headers.map((header) => {
    const source = header.trim();
    const normalized = normalizeHeader(source);
    return {
      source,
      target:
        NORMALIZED.get(normalized) ||
        (Object.hasOwn(ALIASES, normalized) ? ALIASES[normalized] : null) ||
        null,
    };
  });
  const mapped = new Set();
  for (const mapping of mappings) {
    if (!mapping.target)
      problem(
        1,
        mapping.source || '(empty header)',
        'Unknown column; this column is ignored by the preview.',
        'warning',
      );
    else if (mapped.has(mapping.target))
      problem(1, mapping.source, `Multiple columns map to ${mapping.target}.`);
    else mapped.add(mapping.target);
  }
  for (const required of REQUIRED)
    if (!mapped.has(required)) problem(1, required, 'Required column is missing.');
  const preview = records.map((record, index) => {
    const row = index + 2;
    if (record.length !== headers.length)
      problem(row, 'row', `Expected ${headers.length} columns; received ${record.length}.`);
    const employee = {};
    mappings.forEach((mapping, i) => {
      if (mapping.target) employee[mapping.target] = (record[i] || '').trim();
    });
    employee.status ||= 'active';
    for (const field of REQUIRED)
      if (!employee[field]) problem(row, field, 'Required value is empty.');
    for (const [field, value] of Object.entries(employee))
      if (/^[\s]*[=+@-]/.test(value))
        problem(row, field, 'Spreadsheet formulas are not accepted in import previews.');
    if (employee.id && !/^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/.test(employee.id))
      problem(
        row,
        'id',
        'Use a stable employee ID containing letters, digits, underscores or hyphens.',
      );
    if (employee.name && (employee.name.length > 100 || /[\r\n\u0000-\u001F]/.test(employee.name)))
      problem(row, 'name', 'Name must be a single line of no more than 100 characters.');
    if (
      employee.email &&
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@peopleos\.example$/.test(employee.email)
    )
      problem(row, 'email', 'Only a valid fictional address at peopleos.example is accepted.');
    if (employee.department && !VALID_DEPARTMENTS.has(employee.department))
      problem(
        row,
        'department',
        'Department must match the target taxonomy: People, Engineering, Learning, Operations, Data, Finance or Talent.',
      );
    if (employee.country && !COUNTRY_CODES.has(employee.country))
      problem(row, 'country', 'Country is outside the 13-country demo catalogue.');
    if (
      employee.country &&
      employee.countryCode &&
      COUNTRY_CODES.get(employee.country) !== employee.countryCode
    )
      problem(row, 'countryCode', 'Country code does not match the selected country.');
    if (employee.startDate && !validIsoDate(employee.startDate))
      problem(
        row,
        'startDate',
        'Use a real calendar date in YYYY-MM-DD format, from 1900 to 2100.',
      );
    if (!['active', 'onboarding', 'leave'].includes(employee.status))
      problem(row, 'status', 'Use active, onboarding or leave.');
    return employee;
  });
  const identities = new Map(),
    emails = new Map();
  const managerNames = new Set([
    ...existingEmployees.map((e) => e.name),
    ...preview.map((e) => e.name),
  ]);
  preview.forEach((employee, i) => {
    const row = i + 2;
    for (const [field, seen] of [
      ['id', identities],
      ['email', emails],
    ]) {
      const key = employee[field]?.toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        problem(row, field, `Duplicate ${field}; also appears on row ${seen.get(key)}.`);
        if (
          !errors.some(
            (error) =>
              error.row === seen.get(key) &&
              error.field === field &&
              error.message.startsWith('Duplicate'),
          )
        )
          problem(seen.get(key), field, `Duplicate ${field}; also appears on row ${row}.`);
      } else seen.set(key, row);
    }
    if (
      employee.manager &&
      (!managerNames.has(employee.manager) || employee.manager === employee.name)
    )
      problem(
        row,
        'manager',
        'Manager must reference another employee in the CSV or current demo workspace.',
      );
  });
  const invalidRows = new Set(
    errors.filter((error) => error.severity === 'error' && error.row > 1).map((error) => error.row),
  );
  const headerFailure = errors.some((error) => error.severity === 'error' && error.row === 1);
  const validRows = headerFailure ? 0 : records.length - invalidRows.size;
  return {
    rows: records.length,
    validRows,
    errors,
    mappings,
    preview: preview.slice(0, 5),
    summary: `${records.length} records parsed; ${validRows} pass all preview checks. No records have been imported.`,
    mode: 'preview',
    writes: 0,
    checks: [
      'required_columns',
      'required_values',
      'duplicate_ids',
      'duplicate_emails',
      'fictional_email_domain',
      'country_mapping',
      'department_taxonomy',
      'calendar_dates',
      'manager_references',
      'spreadsheet_formulas',
    ],
    syntheticOnly: true,
  };
}
