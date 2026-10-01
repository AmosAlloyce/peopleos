import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, CircleAlert, FileCheck2, ShieldCheck } from 'lucide-react';
import './ReadinessLens.css';

export default function ReadinessLens({ employees, issues, runs, country, onIssue, onRehearse, onMigration }) {
  const panel = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const open = issues.filter((issue) => issue.status !== 'resolved');
  const issueByPerson = new Map(employees.map((employee) => [
    employee.id, open.filter((issue) => issue.employeeId === employee.id),
  ]));
  const affected = employees.filter((employee) => issueByPerson.get(employee.id).length > 0);
  const selected = employees.find((employee) => employee.id === selectedId) || affected[0] || employees[0];
  const selectedIssues = selected ? issueByPerson.get(selected.id) : [];
  const scopedIssues = employees.reduce((count, employee) => count + issueByPerson.get(employee.id).length, 0);
  const pending = runs.filter((run) => run.status === 'awaiting_approval').length;
  const clean = employees.length - affected.length;

  useEffect(() => {
    const element = panel.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('readiness-entered');
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function moveSelection(event, index) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!delta && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? employees.length - 1
      : (index + delta + employees.length) % employees.length;
    setSelectedId(employees[next].id);
    panel.current.querySelector(`[data-readiness-record="${employees[next].id}"]`)?.focus();
  }

  return (
    <section ref={panel} className="readiness-lens" aria-labelledby="readiness-title" data-sc-act="flow">
      <header className="readiness-header">
        <div className="readiness-title">
          <FileCheck2 size={21} aria-hidden="true" />
          <h2 id="readiness-title">Readiness lens</h2>
          <span>{country === 'all' ? 'All countries' : country}</span>
        </div>
        <span className="readiness-disclosure">Your synthetic workspace</span>
      </header>
      <div className="readiness-body">
        <div className="readiness-records">
          <div className="readiness-summary">
            <p><strong>{clean} of {employees.length}</strong> records without open exceptions</p>
            <span>{scopedIssues ? `${scopedIssues} ${scopedIssues === 1 ? 'exception' : 'exceptions'} to inspect` : 'Configured checks clear'}</span>
          </div>
          <div className="readiness-matrix" role="radiogroup" aria-label="Inspect employee readiness">
            {employees.map((employee, index) => {
              const count = issueByPerson.get(employee.id).length;
              const active = selected?.id === employee.id;
              return (
                <button
                  key={employee.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${employee.name}: ${count ? `${count} open ${count === 1 ? 'exception' : 'exceptions'}` : 'no open exceptions'}`}
                  title={employee.name}
                  tabIndex={active ? 0 : -1}
                  data-readiness-record={employee.id}
                  className={`readiness-record ${count ? 'has-exception' : 'is-clear'} ${active ? 'is-selected' : ''}`}
                  onClick={() => setSelectedId(employee.id)}
                  onKeyDown={(event) => moveSelection(event, index)}
                >
                  {employee.id.replace('EMP-', '')}
                </button>
              );
            })}
          </div>
          <label className="readiness-mobile-select">
            Inspect a person
            <select value={selected?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} · {issueByPerson.get(employee.id).length ? 'Needs review' : 'Checks clear'}
                </option>
              ))}
            </select>
          </label>
          <div className="readiness-key">
            <span><i className="readiness-key-clear" />{clean} clear</span>
            <span><i className="readiness-key-open" />{affected.length} need review</span>
            <span className="readiness-key-hint">Select a record to inspect</span>
          </div>
        </div>
        <div className="readiness-detail" aria-live="polite" aria-atomic="true">
          {selected ? <>
            <div className="readiness-person">
              <span className={`readiness-person-status ${selectedIssues.length ? 'needs-review' : ''}`}>
                {selectedIssues.length ? <CircleAlert size={18} /> : <Check size={18} />}
              </span>
              <div>
                <h3>{selected.name}</h3>
                <p>{selected.id} · {selected.country}</p>
              </div>
            </div>
            {selectedIssues.length ? <>
              <p className="readiness-rule">{selectedIssues[0].rule}</p>
              <div className="readiness-source">
                <span>{selectedIssues[0].field}</span>
                <code>{selectedIssues[0].currentValue || 'Missing value'}</code>
              </div>
              <button className="readiness-action" onClick={() => onIssue(selectedIssues[0])}>
                Inspect exception <ArrowRight size={16} />
              </button>
              {selectedIssues.length > 1 && <small>{selectedIssues.length - 1} more open {selectedIssues.length === 2 ? 'exception' : 'exceptions'} for this person</small>}
            </> : <>
              <p className="readiness-rule">No open exceptions in the configured sample checks.</p>
              <p className="readiness-clear-note"><ShieldCheck size={16} />Source record available for your next rehearsal.</p>
              <button className="readiness-action" onClick={onMigration}>Open migration hub <ArrowRight size={16} /></button>
            </>}
          </> : <p>No records in this country scope.</p>}
        </div>
      </div>
      <footer className="readiness-trace">
        <div className="readiness-trace-stages" aria-label="Source to review trace">
          <span><strong>{employees.length}</strong> source records</span>
          <ChevronRight size={14} aria-hidden="true" />
          <span><strong>{scopedIssues}</strong> open exceptions</span>
          <ChevronRight size={14} aria-hidden="true" />
          <span><strong>{pending}</strong> proposals awaiting approval <small>(workspace)</small></span>
        </div>
        <button className="readiness-action" onClick={onRehearse}>Rehearse migration <ArrowRight size={16} /></button>
      </footer>
    </section>
  );
}
