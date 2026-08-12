import './style.css';
import { initNativeShell } from './native';
import {
  acceptIntake,
  advanceDay,
  assignMatch,
  chooseEvent,
  clearMatch,
  declineIntake,
  doCare,
  finishAdoption,
  finishCare,
  finishIntake,
  getState,
  pickRelic,
  previewMatch,
  skipRelic,
  startRun,
  subscribe,
  type CareAction,
} from './game/game';
import { TRAIT_LABELS, type Adopter, type Pet, type RunState } from './game/types';
import { effectiveCapacity } from './game/generators';

void initNativeShell();

const app = document.querySelector<HTMLDivElement>('#app')!;

subscribe(render);
render();

function render(): void {
  const s = getState();
  if (s.phase === 'title') {
    app.innerHTML = renderTitle();
    bindTitle();
    return;
  }
  if (s.phase === 'ended') {
    app.innerHTML = renderEnded(s);
    bindEnded();
    return;
  }

  app.innerHTML = `
    <div class="shell">
      ${renderHud(s)}
      ${renderPhase(s)}
      ${renderLog(s)}
    </div>
  `;
  bindPhase(s);
}

function renderTitle(): string {
  return `
    <section class="title-screen shell">
      <div class="eyebrow" style="letter-spacing:.14em;text-transform:uppercase;font-weight:800;opacity:.75">Roguelike shelter sim</div>
      <h1>Pawfect Shelter</h1>
      <p>Take in animals under tight kennels, keep them calm, and match each one to the right home before the season ends.</p>
      <div class="row-actions">
        <button class="btn" id="start">Start a season</button>
      </div>
    </section>
  `;
}

function bindTitle(): void {
  document.getElementById('start')?.addEventListener('click', () => startRun());
}

function renderEnded(s: RunState): string {
  return `
    <section class="ended shell">
      <h1>${s.won ? 'Homes found.' : 'Season closed.'}</h1>
      <p>${s.endReason ?? ''}</p>
      <p>Adoptions ${s.adoptions} · Returns ${s.returns} · Gold ${s.gold} · Rep ${s.reputation}</p>
      <div class="row-actions">
        <button class="btn" id="again">Run again</button>
      </div>
    </section>
  `;
}

function bindEnded(): void {
  document.getElementById('again')?.addEventListener('click', () => startRun());
}

function renderHud(s: RunState): string {
  const phaseLabel: Record<string, string> = {
    intake: 'Morning intake',
    care: 'Care shift',
    adoption: 'Adoption hours',
    event: 'Shelter event',
    relic: 'Upgrade offer',
    summary: 'Day summary',
  };
  return `
    <div class="hud">
      <div class="brand-lockup">
        <div class="eyebrow">Day ${s.day} / ${s.maxDays}</div>
        <h1>Pawfect Shelter</h1>
        <div style="opacity:.8;font-weight:700">${phaseLabel[s.phase] ?? s.phase}</div>
      </div>
      <div class="meters">
        <div class="meter">🏠 ${s.pets.length}/${effectiveCapacity(s)}</div>
        <div class="meter">🥫 ${s.supplies}</div>
        <div class="meter">⚡ ${s.energy}</div>
        <div class="meter">💛 ${s.reputation}</div>
        <div class="meter">🪙 ${s.gold}</div>
        <div class="meter">✅ ${s.adoptions}</div>
      </div>
    </div>
  `;
}

function renderLog(s: RunState): string {
  if (!s.log.length) return '';
  return `
    <ul class="log">
      ${s.log
        .map((l) => `<li class="${l.tone ?? 'neutral'}">${escapeHtml(l.text)}</li>`)
        .join('')}
    </ul>
  `;
}

function renderPhase(s: RunState): string {
  switch (s.phase) {
    case 'intake':
      return renderIntake(s);
    case 'care':
      return renderCare(s);
    case 'adoption':
      return renderAdoption(s);
    case 'event':
      return renderEvent(s);
    case 'relic':
      return renderRelic(s);
    case 'summary':
      return renderSummary(s);
    default:
      return '';
  }
}

function petCard(pet: Pet, body: string): string {
  const stressPct = (pet.stress / 3) * 100;
  const traits = (Object.keys(TRAIT_LABELS) as (keyof typeof TRAIT_LABELS)[])
    .filter((k) => pet.traits[k])
    .map((k) => `<span class="tag ${k === 'specialNeeds' ? 'warn' : ''}">${TRAIT_LABELS[k]}</span>`)
    .join('');
  return `
    <article class="card" data-pet="${pet.id}">
      <div class="card-top">
        <div>
          <div class="emoji">${pet.emoji}</div>
          <h3>${escapeHtml(pet.name)}</h3>
          <div style="color:var(--muted);font-size:.9rem;font-weight:700">
            ${pet.species} · ${pet.size} · ${pet.energy}
          </div>
        </div>
        <div class="tag">Day ${pet.daysHeld}</div>
      </div>
      <div class="stress" title="Stress ${pet.stress}/3"><span style="width:${stressPct}%"></span></div>
      <div class="tags">${traits || '<span class="tag">No special traits</span>'}</div>
      ${body}
    </article>
  `;
}

function renderIntake(s: RunState): string {
  const incoming = s.intake.length
    ? s.intake
        .map((p) =>
          petCard(
            p,
            `<div class="actions">
              <button class="btn small" data-accept="${p.id}">Accept</button>
              <button class="btn small ghost" data-decline="${p.id}">Turn away</button>
            </div>`,
          ),
        )
        .join('')
    : `<p style="color:var(--muted);margin:0">No animals waiting — continue to care.</p>`;

  const housed = s.pets.map((p) => petCard(p, '')).join('');

  return `
    <section class="panel">
      <header>
        <div>
          <h2>Who comes in?</h2>
          <p>Kennels are scarce. Accepting fills capacity; turning away costs a little reputation.</p>
        </div>
      </header>
      <div class="grid intake">${incoming}</div>
      <h3 style="margin:1rem 0 .5rem">In the shelter</h3>
      <div class="grid pets">${housed || '<p style="color:var(--muted)">Empty kennels</p>'}</div>
      <div class="row-actions">
        <button class="btn" id="to-care">Start care shift</button>
      </div>
    </section>
  `;
}

function renderCare(s: RunState): string {
  const cards = s.pets
    .map((p) =>
      petCard(
        p,
        `<div class="actions">
          <button class="btn small ghost" data-care="feed" data-pet="${p.id}">Feed (1🥫)</button>
          <button class="btn small ghost" data-care="play" data-pet="${p.id}">Play</button>
          <button class="btn small ghost" data-care="train" data-pet="${p.id}">Train</button>
          <button class="btn small ghost" data-care="treat" data-pet="${p.id}">Treat (2🥫)</button>
        </div>`,
      ),
    )
    .join('');

  return `
    <section class="panel">
      <header>
        <div>
          <h2>Care shift</h2>
          <p>Spend staff energy to lower stress and prep pets for better matches. Energy left: <strong>${s.energy}</strong></p>
        </div>
      </header>
      <div class="grid pets">${cards || '<p>No pets to care for.</p>'}</div>
      <div class="row-actions">
        <button class="btn" id="to-adopt">Open adoption hours</button>
      </div>
    </section>
  `;
}

function renderAdoption(s: RunState): string {
  const petOptions = s.pets
    .map((p) => `<option value="${p.id}">${p.emoji} ${p.name} (${p.species}, stress ${p.stress})</option>`)
    .join('');

  const cards = s.adopters
    .map((a) => {
      const prefs = formatPrefs(a);
      const selected = a.matchedPetId ?? '';
      const preview = selected ? previewMatch(a.id, selected) : null;
      return `
        <article class="card">
          <div class="card-top">
            <div>
              <div class="emoji">${a.emoji}</div>
              <h3>${escapeHtml(a.name)}</h3>
              <div style="color:var(--muted);font-size:.9rem;font-weight:700">${a.prefs.home} home</div>
            </div>
            ${preview ? `<div class="grade ${preview.grade}">${preview.grade}</div>` : ''}
          </div>
          <div class="tags">${prefs}</div>
          <div class="match-row">
            <select data-adopter="${a.id}">
              <option value="">— Choose a pet —</option>
              ${petOptions}
            </select>
            ${selected ? `<button class="btn small ghost" data-clear="${a.id}">Clear</button>` : ''}
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <section class="panel">
      <header>
        <div>
          <h2>Matchmaking</h2>
          <p>Assign pets to visitors. Perfect/good placements pay off; stretch matches may return; bad matches refuse.</p>
        </div>
      </header>
      <div class="grid adopters">${cards}</div>
      <div class="row-actions">
        <button class="btn" id="finish-adopt">Close the desk</button>
      </div>
    </section>
  `;
}

function formatPrefs(a: Adopter): string {
  const bits: string[] = [];
  if (a.prefs.species) bits.push(`<span class="tag">${a.prefs.species}</span>`);
  if (a.prefs.size) bits.push(`<span class="tag">size ${a.prefs.size}</span>`);
  if (a.prefs.energy) bits.push(`<span class="tag">${a.prefs.energy}</span>`);
  for (const k of a.prefs.must) bits.push(`<span class="tag good">must: ${TRAIT_LABELS[k]}</span>`);
  for (const k of a.prefs.nice) bits.push(`<span class="tag">nice: ${TRAIT_LABELS[k]}</span>`);
  for (const k of a.prefs.dealbreakers) bits.push(`<span class="tag warn">no ${TRAIT_LABELS[k]}</span>`);
  return bits.join('') || '<span class="tag">Open-minded</span>';
}

function renderEvent(s: RunState): string {
  const e = s.pendingEvent!;
  return `
    <section class="panel">
      <header>
        <div>
          <h2>${e.emoji} ${escapeHtml(e.title)}</h2>
          <p>${escapeHtml(e.body)}</p>
        </div>
      </header>
      <div class="row-actions">
        ${e.choices
          .map((c) => `<button class="btn ${c.id === e.choices[0]?.id ? '' : 'ghost'}" data-event="${c.id}">${escapeHtml(c.label)}</button>`)
          .join('')}
      </div>
    </section>
  `;
}

function renderRelic(s: RunState): string {
  const cards = s.pendingRelics
    .map(
      (r) => `
      <article class="card">
        <div class="emoji">${r.emoji}</div>
        <h3>${escapeHtml(r.name)}</h3>
        <p style="margin:0;color:var(--muted)">${escapeHtml(r.description)}</p>
        <button class="btn small" data-relic="${r.id}">Take</button>
      </article>`,
    )
    .join('');
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Shelter upgrade</h2>
          <p>Pick one relic for the rest of this season.</p>
        </div>
      </header>
      <div class="grid pets">${cards}</div>
      <div class="row-actions">
        <button class="btn ghost" id="skip-relic">Skip</button>
      </div>
    </section>
  `;
}

function renderSummary(s: RunState): string {
  const relics = s.relics.map((r) => `<span class="tag">${r.emoji} ${escapeHtml(r.name)}</span>`).join('') || '<span class="tag">None yet</span>';
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Day ${s.day} wrapped</h2>
          <p>Win by Day ${s.maxDays} with at least 6 adoptions and 40 reputation. Currently ${s.adoptions} adoptions, ${s.reputation} rep.</p>
        </div>
      </header>
      <div class="tags">${relics}</div>
      <div class="row-actions">
        <button class="btn" id="next-day">${s.day >= s.maxDays ? 'Finish season' : 'Next day'}</button>
      </div>
    </section>
  `;
}

function bindPhase(s: RunState): void {
  if (s.phase === 'intake') {
    app.querySelectorAll<HTMLButtonElement>('[data-accept]').forEach((btn) => {
      btn.addEventListener('click', () => acceptIntake(btn.dataset.accept!));
    });
    app.querySelectorAll<HTMLButtonElement>('[data-decline]').forEach((btn) => {
      btn.addEventListener('click', () => declineIntake(btn.dataset.decline!));
    });
    document.getElementById('to-care')?.addEventListener('click', () => finishIntake());
  }

  if (s.phase === 'care') {
    app.querySelectorAll<HTMLButtonElement>('[data-care]').forEach((btn) => {
      btn.addEventListener('click', () => doCare(btn.dataset.pet!, btn.dataset.care as CareAction));
    });
    document.getElementById('to-adopt')?.addEventListener('click', () => finishCare());
  }

  if (s.phase === 'adoption') {
    app.querySelectorAll<HTMLSelectElement>('select[data-adopter]').forEach((sel) => {
      const adopterId = sel.dataset.adopter!;
      const adopter = s.adopters.find((a) => a.id === adopterId);
      if (adopter?.matchedPetId) sel.value = adopter.matchedPetId;
      sel.addEventListener('change', () => {
        if (!sel.value) clearMatch(adopterId);
        else assignMatch(adopterId, sel.value);
      });
    });
    app.querySelectorAll<HTMLButtonElement>('[data-clear]').forEach((btn) => {
      btn.addEventListener('click', () => clearMatch(btn.dataset.clear!));
    });
    document.getElementById('finish-adopt')?.addEventListener('click', () => finishAdoption());
  }

  if (s.phase === 'event') {
    app.querySelectorAll<HTMLButtonElement>('[data-event]').forEach((btn) => {
      btn.addEventListener('click', () => chooseEvent(btn.dataset.event!));
    });
  }

  if (s.phase === 'relic') {
    app.querySelectorAll<HTMLButtonElement>('[data-relic]').forEach((btn) => {
      btn.addEventListener('click', () => pickRelic(btn.dataset.relic!));
    });
    document.getElementById('skip-relic')?.addEventListener('click', () => skipRelic());
  }

  if (s.phase === 'summary') {
    document.getElementById('next-day')?.addEventListener('click', () => advanceDay());
  }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
