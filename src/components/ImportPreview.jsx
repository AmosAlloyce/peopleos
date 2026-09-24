import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Badge, Busy, Modal } from './UI.jsx';
const example =
  'employee_id,full_name,work_email,department,country,country_code,start_date,manager_name\nDEMO-501,Demo Starter,demo.starter@peopleos.example,People,Kenya,KE,2024-02-29,Wanjiku Mwangi\nDEMO-502,Demo Analyst,demo.analyst@peopleos.example,Data,Senegal,UNK,2026-02-31,Wanjiku Mwangi';
export default function ImportPreview({ onClose, onValidated }) {
  const [csv, setCsv] = useState(example),
    [result, setResult] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [fileName, setFileName] = useState('example-migration.csv');
  async function upload(file) {
    if (!file) return;
    if (file.size > 256 * 1024) {
      setError('Choose a CSV smaller than 256 KB.');
      return;
    }
    setCsv(await file.text());
    setFileName(file.name);
    setResult(null);
    setError('');
  }
  async function validate() {
    setBusy(true);
    setError('');
    try {
      const next = await api('/import', { csv });
      setResult(next);
      await onValidated();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="CSV migration lab" onClose={onClose} wide>
      <div className="import-intro">
        <span>
          <FileSpreadsheet size={27} />
        </span>
        <div>
          <h3>Understand your data before it moves.</h3>
          <p>Preview a synthetic CSV, inspect field mappings, and find errors before importing.</p>
        </div>
        <Badge tone="green">Preview only</Badge>
      </div>
      <div className="import-notice">
        <ShieldCheck size={16} />
        <p>
          Use fictional records with <code>@peopleos.example</code> email addresses. Your file is
          validated on this server and never sent to an AI provider. No employee records are
          changed.
        </p>
      </div>
      <div className="import-toolbar">
        <span>{fileName}</span>
        <div>
          <button
            onClick={() => {
              setCsv(example);
              setFileName('example-migration.csv');
              setResult(null);
            }}
          >
            Load example
          </button>
          <label className="button">
            <Upload size={14} />
            Choose CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>
      <label className="sr-only" htmlFor="csv-source">
        CSV source
      </label>
      <textarea
        id="csv-source"
        className="csv-editor"
        value={csv}
        spellCheck="false"
        onChange={(e) => {
          setCsv(e.target.value);
          setResult(null);
        }}
        rows="7"
      />
      <div className="import-controls">
        <span>Up to 500 rows · 256 KB · quoted fields supported</span>
        <button className="button primary" disabled={busy || !csv.trim()} onClick={validate}>
          {busy ? (
            <Busy>Validating…</Busy>
          ) : (
            <>
              Validate preview
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="import-result" aria-live="polite">
          <div className="import-result-stats">
            <span>
              <strong>{result.rows}</strong>rows parsed
            </span>
            <span>
              <strong>{result.validRows}</strong>valid rows
            </span>
            <span>
              <strong>{result.errors.filter((e) => e.severity === 'error').length}</strong>errors
              found
            </span>
            <span>
              <strong>{result.writes}</strong>employee writes
            </span>
          </div>
          <p>{result.summary}</p>
          <h4>Validation results</h4>
          {result.errors.length > 0 ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Field</th>
                    <th>Finding</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td>{e.row}</td>
                      <td>
                        <code>{e.field}</code>
                      </td>
                      <td className="import-error-message">{e.message}</td>
                      <td>
                        <Badge tone={e.severity === 'error' ? 'amber' : 'neutral'}>
                          {e.severity}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="inline-note">
              <Check size={17} />
              All supplied rows passed the configured checks.
            </div>
          )}
          <details className="import-mappings">
            <summary>Inspect {result.mappings.length} field mappings</summary>
            <div>
              {result.mappings.map((m, i) => (
                <span key={i}>
                  <code>{m.source}</code>
                  <ArrowRight size={12} />
                  <code>{m.target || 'Unmapped'}</code>
                </span>
              ))}
            </div>
          </details>
        </div>
      )}
    </Modal>
  );
}
