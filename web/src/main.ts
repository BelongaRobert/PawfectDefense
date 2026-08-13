import './style.css';
import { initNativeShell } from './native';
import {
  abandonRun,
  acceptIntake,
  advanceDay,
  assignMatch,
  buySupplies,
  restockCost,
  bootToTitle,
  chooseEvent,
  clearMatch,
  continueRun,
  declineIntake,
  doCare,
  enterEndlessMode,
  finishAdoption,
  finishAfterVictory,
  finishCare,
  finishIntake,
  getProfile,
  getSaveFlash,
  getState,
  pickRelic,
  previewMatch,
  retireEndless,
  saveCheckpoint,
  skipRelic,
  startRun,
  subscribe,
  updatePlayerName,
  type CareAction,
} from './game/game';
import { continueSummary, hasContinue } from './game/save';
import { TRAIT_LABELS, type Adopter, type Pet, type RunState } from './game/types';
import { effectiveCapacity } from './game/generators';
import { STARTER_SPECIES, UNLOCKS, unlockedSpecies, xpToNextLevel } from './game/progression';

void initNativeShell();

const app = document.querySelector<HTMLDivElement>('#app')!;

bootToTitle();
subscribe(render);
render();

function render(): void {
  const s = getState();
  if (s.phase === 'title') {
    app.innerHTML = renderTitle();
    bindTitle();
    return;
  }
  if (s.phase === 'victory') {
    app.innerHTML = renderVictory(s);
    bindVictory();
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
  const profile = getProfile();
  const cont = continueSummary();
  const stats = profile.stats;
  const xp = xpToNextLevel(profile.xp || 0);
  const pct = Math.min(100, Math.round((xp.into / xp.need) * 100));
  const species = unlockedSpecies(profile.unlocks);
  const locked = UNLOCKS.filter((u) => !(profile.unlocks || []).includes(u.id));
  return `
    <section class="title-screen shell">
      <div class="eyebrow" style="letter-spacing:.14em;text-transform:uppercase;font-weight:800;opacity:.75">Roguelike shelter sim</div>
      <h1>Pawfect Shelter</h1>
      <p>Take in animals under tight kennels, keep them calm, and match each one to the right home before the season ends.</p>

      <label class="profile-field">
        <span>Your name</span>
        <input id="player-name" type="text" maxlength="24" placeholder="Shelter manager"
          value="${escapeHtml(profile.name)}" autocomplete="nickname" />
      </label>

      <div class="profile-card">
        <div class="profile-card-title">${escapeHtml(profile.name || 'New manager')} · Lv ${profile.level || 1}</div>
        <div class="xp-bar" aria-label="Shelter XP">
          <span style="width:${pct}%"></span>
        </div>
        <div class="profile-stats">
          <span>${profile.xp || 0} XP</span>
          <span>${xp.into}/${xp.need} to next</span>
          <span>${stats.seasonsWon} wins</span>
          <span>${stats.totalAdoptions} adoptions</span>
          ${stats.endlessBestDay ? `<span>Endless Day ${stats.endlessBestDay}</span>` : ''}
        </div>
        <div class="unlock-row">
          <span class="unlock-label">Species</span>
          ${[...STARTER_SPECIES, ...UNLOCKS.filter((u) => u.kind === 'species').map((u) => u.species!)]
            .filter((v, i, a) => a.indexOf(v) === i)
            .map((sp) => {
              const open = species.includes(sp);
              return `<span class="tag ${open ? 'good' : 'locked'}">${open ? '✓' : '🔒'} ${sp}</span>`;
            })
            .join('')}
        </div>
        ${
          locked.length
            ? `<div class="unlock-row">
                <span class="unlock-label">Next unlocks</span>
                ${locked
                  .slice(0, 3)
                  .map((u) => `<span class="tag">Lv ${u.level} ${u.emoji} ${escapeHtml(u.name)}</span>`)
                  .join('')}
              </div>`
            : ''
        }
      </div>

      ${
        cont
          ? `<div class="continue-card">
              <div>Saved season — Day ${cont.day}, ${cont.adoptions} adoptions, ${cont.reputation} rep</div>
              <div class="row-actions" style="margin-top:.65rem">
                <button class="btn" id="continue">Continue</button>
                <button class="btn secondary" id="abandon">Abandon save</button>
              </div>
            </div>`
          : ''
      }

      <div class="row-actions">
        <button class="btn" id="start">${cont ? 'New season' : 'Start a season'}</button>
      </div>
    </section>
  `;
}

function bindTitle(): void {
  const nameInput = document.getElementById('player-name') as HTMLInputElement | null;
  nameInput?.addEventListener('change', () => updatePlayerName(nameInput.value));
  nameInput?.addEventListener('blur', () => updatePlayerName(nameInput.value));
  document.getElementById('start')?.addEventListener('click', () => {
    if (nameInput) updatePlayerName(nameInput.value);
    if (hasContinue() && !confirm('Start a new season? Your saved run will be replaced.')) return;
    startRun();
  });
  document.getElementById('continue')?.addEventListener('click', () => continueRun());
  document.getElementById('abandon')?.addEventListener('click', () => {
    if (confirm('Abandon the saved season?')) abandonRun();
  });
}

function renderRewardBlock(): string {
  const reward = getProfile().lastReward;
  if (!reward) return '';
  return `
    <div class="reward-card">
      <div class="reward-title">+${reward.xp} Shelter XP</div>
      <div class="profile-stats">
        ${reward.parts.map((p) => `<span>${escapeHtml(p.label)} +${p.amount}</span>`).join('')}
      </div>
      ${
        reward.newUnlocks.length
          ? `<div class="unlock-row">${reward.newUnlocks
              .map((u) => `<span class="tag good">${u.emoji} Unlocked ${escapeHtml(u.name)}</span>`)
              .join('')}</div>`
          : ''
      }
    </div>
  `;
}

function renderVictory(s: RunState): string {
  const profile = getProfile();
  return `
    <section class="ended shell victory-screen">
      <div class="eyebrow" style="letter-spacing:.14em;text-transform:uppercase;font-weight:800;opacity:.75">Season cleared</div>
      <h1>Congratulations!</h1>
      <p>You kept the shelter standing for ${s.maxDays} days — ${s.adoptions} pets found homes with reputation ${s.reputation}.</p>
      ${renderRewardBlock()}
      <p>Want to keep going? Endless Mode raises the pressure: busier intake, pickier adopters, and inspections that never quit.</p>
      <p class="ended-profile">${escapeHtml(profile.name || 'Manager')} · Lv ${profile.level} · ${profile.xp} XP</p>
      <div class="row-actions">
        <button class="btn" id="endless">Endless Mode</button>
        <button class="btn secondary" id="finish-season">Finish season</button>
      </div>
    </section>
  `;
}

function bindVictory(): void {
  document.getElementById('endless')?.addEventListener('click', () => enterEndlessMode());
  document.getElementById('finish-season')?.addEventListener('click', () => finishAfterVictory());
}

function renderEnded(s: RunState): string {
  const profile = getProfile();
  return `
    <section class="ended shell">
      <h1>${s.won ? 'Homes found.' : 'Season closed.'}</h1>
      <p>${escapeHtml(s.endReason ?? '')}</p>
      <p>Adoptions ${s.adoptions} · Returns ${s.returns} · Gold ${s.gold} · Rep ${s.reputation}${s.endless || s.day > s.maxDays ? ` · Day ${s.day}` : ''}</p>
      ${renderRewardBlock()}
      <p class="ended-profile">${escapeHtml(profile.name || 'Manager')} · Lv ${profile.level} · ${profile.xp} XP · ${profile.stats.seasonsWon} wins</p>
      <div class="row-actions">
        <button class="btn" id="again">Run again</button>
        <button class="btn secondary" id="to-title">Profile</button>
      </div>
    </section>
  `;
}

function bindEnded(): void {
  document.getElementById('again')?.addEventListener('click', () => startRun());
  document.getElementById('to-title')?.addEventListener('click', () => bootToTitle());
}

function renderHud(s: RunState): string {
  const profile = getProfile();
  const flash = getSaveFlash();
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
        <div class="eyebrow">${s.endless ? `Endless · Day ${s.day}` : `Day ${s.day} / ${s.maxDays}`}${profile.name ? ` · ${escapeHtml(profile.name)}` : ''}</div>
        <h1>Pawfect Shelter</h1>
        <div style="opacity:.8;font-weight:700">${phaseLabel[s.phase] ?? s.phase}</div>
        ${flash ? `<div class="save-flash">${escapeHtml(flash)}</div>` : ''}
      </div>
      <div class="meters">
        <div class="meter">🏠 ${s.pets.length}/${effectiveCapacity(s)}</div>
        <div class="meter">🥫 ${s.supplies} food</div>
        <div class="meter">⚡ ${s.energy}</div>
        <div class="meter">💛 ${s.reputation}</div>
        <div class="meter">🪙 ${s.gold}</div>
        <div class="meter">✅ ${s.adoptions}</div>
        <button class="meter meter-btn" id="save-now" type="button">💾 Save</button>
      </div>
    </div>
  `;
}

function renderLog(s: RunState): string {
  if (!s.log.length) return '';
  return `
    <section class="log-panel" aria-label="Activity log">
      <div class="log-heading">Activity log</div>
      <ul class="log">
        ${s.log
          .map((l) => `<li class="${l.tone ?? 'neutral'}">${escapeHtml(l.text)}</li>`)
          .join('')}
      </ul>
    </section>
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
      <div class="tags">
        ${!pet.fedToday ? '<span class="tag warn">Hungry</span>' : '<span class="tag good">Fed</span>'}
        ${pet.treatBoost ? '<span class="tag good">Treat boost</span>' : ''}
        ${traits || ''}
      </div>
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
          <p>Feed stops overnight hunger and helps matches. Treats wow adopters (better grade + extra gold). Energy left: <strong>${s.energy}</strong> · Food: <strong>${s.supplies}</strong></p>
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
    .map((p) => `<option value="${p.id}">${p.emoji} ${p.name} (${p.species}${p.fedToday ? '' : ', hungry'}${p.treatBoost ? ', treat' : ''}, stress ${p.stress})</option>`)
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
  const blurb = s.endless
    ? `Endless Mode — survive as long as you can. ${s.adoptions} adoptions, ${s.reputation} rep.`
    : `Win by Day ${s.maxDays} with at least 6 adoptions and 40 reputation. Currently ${s.adoptions} adoptions, ${s.reputation} rep.`;
  const nextLabel = s.endless
    ? 'Next day'
    : s.day >= s.maxDays
      ? 'See results'
      : 'Next day';
  const cost = restockCost();
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Day ${s.day} wrapped${s.endless ? ' · Endless' : ''}</h2>
          <p>${blurb}</p>
        </div>
      </header>
      <div class="tags">${relics}</div>
      <p style="color:var(--muted);margin:0.85rem 0 0;font-weight:700">Stockroom — ${s.supplies} food · ${s.gold} gold. Unfed pets get hungrier overnight.</p>
      <div class="row-actions">
        <button class="btn ghost" id="buy-food" ${s.gold < cost ? 'disabled' : ''}>Buy 3 food (${cost}🪙)</button>
        <button class="btn" id="next-day">${nextLabel}</button>
        ${s.endless ? '<button class="btn ghost" id="retire-endless">Retire shelter</button>' : ''}
      </div>
    </section>
  `;
}

function bindPhase(s: RunState): void {
  document.getElementById('save-now')?.addEventListener('click', () => saveCheckpoint());

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
    document.getElementById('buy-food')?.addEventListener('click', () => buySupplies());
    document.getElementById('next-day')?.addEventListener('click', () => advanceDay());
    document.getElementById('retire-endless')?.addEventListener('click', () => {
      if (confirm('Retire from Endless Mode and bank this run?')) retireEndless();
    });
  }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
