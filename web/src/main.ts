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
  copyRestoreCode,
  createShelterAccount,
  declineIntake,
  deviceUsernames,
  doCare,
  enterEndlessMode,
  finishAdoption,
  finishAfterVictory,
  finishCare,
  finishIntake,
  getAccountNotice,
  getProfile,
  getSaveFlash,
  getSignedInUsername,
  getState,
  hasBackupPassword,
  isLoggedIn,
  loginShelterAccount,
  logoutShelterAccount,
  pickRelic,
  previewMatch,
  restoreShelterAccount,
  retireEndless,
  saveCheckpoint,
  skipRelic,
  startRun,
  subscribe,
  unlockShelterBackup,
  updatePlayerName,
  type CareAction,
} from './game/game';
import { continueSummary, hasContinue } from './game/save';
import { TRAIT_LABELS, type Adopter, type Pet, type RunState } from './game/types';
import { effectiveCapacity } from './game/generators';
import {
  COLONY_PER_KENNEL,
  extraKennelsNeeded,
  habitatTag,
  intakeClusters,
  isColonySpecies,
  kennelLabel,
} from './game/kennel';
import { UNLOCKS, unlockedSpecies, xpToNextLevel } from './game/progression';

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
  const signedIn = isLoggedIn();
  const cont = signedIn ? continueSummary() : null;
  const stats = profile.stats;
  const xp = xpToNextLevel(profile.xp || 0);
  const pct = Math.min(100, Math.round((xp.into / xp.need) * 100));
  const species = unlockedSpecies(profile.unlocks);
  const nextUnlock = UNLOCKS.find((u) => !(profile.unlocks || []).includes(u.id));
  const user = getSignedInUsername();
  const notice = getAccountNotice();
  const onDevice = deviceUsernames();
  const showAccount = !signedIn || !!notice;

  return `
    <section class="title-screen shell">
      <h1>Pawfect Shelter</h1>
      <p class="tagline">Match pets. Fill kennels. Survive 10 days.</p>

      ${
        signedIn
          ? `<div class="profile-card compact">
              <div class="profile-card-title">Lv ${profile.level || 1} · @${escapeHtml(user || '')}</div>
              <div class="xp-bar" aria-label="Shelter XP"><span style="width:${pct}%"></span></div>
              <div class="profile-stats">
                <span>${stats.seasonsWon} wins</span>
                <span>${stats.totalAdoptions} homes</span>
                ${nextUnlock ? `<span>Next: Lv ${nextUnlock.level} ${nextUnlock.emoji}</span>` : ''}
              </div>
              <div class="unlock-row">
                ${species.map((sp) => `<span class="tag good">${sp}</span>`).join('')}
              </div>
            </div>`
          : ''
      }

      ${
        cont
          ? `<div class="continue-card">
              <div class="continue-line">Day ${cont.day} · ${cont.adoptions} homes · ${cont.reputation} rep</div>
              <div class="row-actions" style="margin-top:.55rem">
                <button class="btn" id="continue">Continue</button>
                <button class="btn secondary" id="abandon">Quit save</button>
              </div>
            </div>`
          : ''
      }

      <div class="row-actions play-row">
        <button class="btn play-btn" id="start">${cont ? 'New run' : 'Play'}</button>
      </div>

      <details class="account-drawer" ${showAccount ? 'open' : ''}>
        <summary>${signedIn ? `Account · @${escapeHtml(user || '')}` : 'Save progress'}</summary>
        ${notice ? `<div class="account-notice">${escapeHtml(notice)}</div>` : ''}
        ${
          signedIn
            ? `<label class="profile-field">
                 <span>Shelter name</span>
                 <input id="player-name" type="text" maxlength="24" placeholder="Manager"
                   value="${escapeHtml(profile.name)}" autocomplete="nickname" />
               </label>
               ${
                 hasBackupPassword()
                   ? ''
                   : `<label class="profile-field">
                        <span>Password</span>
                        <input id="unlock-pass" type="password" autocomplete="current-password" />
                      </label>
                      <div class="row-actions" style="margin-top:.45rem">
                        <button class="btn small secondary" id="unlock-backup" type="button">Unlock backup</button>
                      </div>`
               }
               <div class="row-actions" style="margin-top:.55rem">
                 <button class="btn small" id="copy-restore" type="button">Copy code</button>
                 <button class="btn small secondary" id="logout" type="button">Log out</button>
               </div>
               <textarea id="restore-out" class="restore-box" readonly hidden></textarea>`
            : `<label class="profile-field">
                 <span>Username</span>
                 <input id="acct-user" type="text" maxlength="20" autocomplete="username" />
               </label>
               <label class="profile-field">
                 <span>Password</span>
                 <input id="acct-pass" type="password" autocomplete="new-password" />
               </label>
               <div class="row-actions" style="margin-top:.55rem">
                 <button class="btn small" id="acct-create" type="button">Create</button>
                 <button class="btn small secondary" id="acct-login" type="button">Log in</button>
               </div>
               ${onDevice.length ? `<div class="profile-stats" style="margin-top:.5rem">${onDevice.map((n) => `<span>@${escapeHtml(n)}</span>`).join('')}</div>` : ''}
               <label class="profile-field" style="margin-top:.75rem">
                 <span>Restore code</span>
                 <textarea id="restore-in" class="restore-box" placeholder="PFS1...."></textarea>
               </label>
               <label class="profile-field">
                 <span>Password</span>
                 <input id="restore-pass" type="password" autocomplete="current-password" />
               </label>
               <div class="row-actions" style="margin-top:.45rem">
                 <button class="btn small secondary" id="acct-restore" type="button">Restore</button>
               </div>
               <input id="player-name" type="hidden" value="${escapeHtml(profile.name)}" />`
        }
      </details>
    </section>
  `;
}

function bindTitle(): void {
  const nameInput = document.getElementById('player-name') as HTMLInputElement | null;
  nameInput?.addEventListener('change', () => updatePlayerName(nameInput.value));
  nameInput?.addEventListener('blur', () => updatePlayerName(nameInput.value));
  document.getElementById('start')?.addEventListener('click', () => {
    if (nameInput && nameInput.type !== 'hidden') updatePlayerName(nameInput.value);
    if (hasContinue() && !confirm('Start a new run? This replaces your save.')) return;
    startRun();
  });
  document.getElementById('continue')?.addEventListener('click', () => continueRun());
  document.getElementById('abandon')?.addEventListener('click', () => {
    if (confirm('Quit this save?')) abandonRun();
  });

  const userEl = document.getElementById('acct-user') as HTMLInputElement | null;
  const passEl = document.getElementById('acct-pass') as HTMLInputElement | null;
  document.getElementById('acct-create')?.addEventListener('click', () => {
    if (nameInput && nameInput.type !== 'hidden') updatePlayerName(nameInput.value);
    void createShelterAccount(userEl?.value || '', passEl?.value || '');
  });
  document.getElementById('acct-login')?.addEventListener('click', () => {
    void loginShelterAccount(userEl?.value || '', passEl?.value || '');
  });
  document.getElementById('logout')?.addEventListener('click', () => logoutShelterAccount());
  document.getElementById('unlock-backup')?.addEventListener('click', () => {
    const pass = (document.getElementById('unlock-pass') as HTMLInputElement | null)?.value || '';
    void unlockShelterBackup(pass);
  });
  document.getElementById('copy-restore')?.addEventListener('click', async () => {
    const code = copyRestoreCode();
    const box = document.getElementById('restore-out') as HTMLTextAreaElement | null;
    if (!code || !box) return;
    box.hidden = false;
    box.value = code;
    box.select();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* user can copy from the box */
    }
  });
  document.getElementById('acct-restore')?.addEventListener('click', () => {
    const code = (document.getElementById('restore-in') as HTMLTextAreaElement | null)?.value || '';
    const pass = (document.getElementById('restore-pass') as HTMLInputElement | null)?.value || '';
    void restoreShelterAccount(code, pass);
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
      <h1>Season clear!</h1>
      <p>${s.adoptions} homes · ${s.reputation} rep</p>
      ${renderRewardBlock()}
      <p class="ended-profile">Lv ${profile.level} · ${profile.xp} XP</p>
      <div class="row-actions">
        <button class="btn" id="endless">Keep going</button>
        <button class="btn secondary" id="finish-season">Done</button>
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
      <h1>${s.won ? 'Nice run.' : 'Run over.'}</h1>
      <p>${escapeHtml(s.endReason ?? '')}</p>
      <p>${s.adoptions} homes · ${s.returns} returns · ${s.reputation} rep${s.endless || s.day > s.maxDays ? ` · Day ${s.day}` : ''}</p>
      ${renderRewardBlock()}
      <p class="ended-profile">Lv ${profile.level} · ${profile.xp} XP</p>
      <div class="row-actions">
        <button class="btn" id="again">Play again</button>
        <button class="btn secondary" id="to-title">Menu</button>
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
    intake: 'Intake',
    care: 'Care',
    adoption: 'Match',
    event: 'Event',
    relic: 'Upgrade',
    summary: 'Day end',
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
        <div class="meter" title="${s.pets.length} animals">🏠 ${kennelLabel(s.pets, effectiveCapacity(s))}</div>
        <div class="meter">🥫 ${s.supplies} food</div>
        <div class="meter">⚡ ${s.energy}</div>
        <div class="meter">💛 ${s.reputation}</div>
        <div class="meter">🪙 ${s.gold}</div>
        <div class="meter">✅ ${s.adoptions}</div>
        ${isLoggedIn() ? '<button class="meter meter-btn" id="save-now" type="button">💾 Save</button>' : '<div class="meter">Guest</div>'}
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
        ${isColonySpecies(pet.species) ? '<span class="tag">Habitat</span>' : ''}
        ${traits || ''}
      </div>
      ${body}
    </article>
  `;
}

function renderIntake(s: RunState): string {
  const incoming = s.intake.length
    ? intakeClusters(s.intake)
        .map((cluster) => {
          const lead = cluster[0]!;
          if (cluster.length === 1) {
            const extra = extraKennelsNeeded(s.pets, cluster);
            const fit =
              extra === 0 && isColonySpecies(lead.species)
                ? 'Fits habitat'
                : extra === 1
                  ? '1 kennel'
                  : `${extra} kennels`;
            return petCard(
              lead,
              `<p class="card-note">${fit}</p>
              <div class="actions">
                <button class="btn small" data-accept="${lead.id}">Take in</button>
                <button class="btn small ghost" data-decline="${lead.id}">Pass</button>
              </div>`,
            );
          }
          const extra = extraKennelsNeeded(s.pets, cluster);
          const kennelNote = extra === 0 ? 'Fits habitat' : `${extra} kennel${extra === 1 ? '' : 's'}`;
          const names = cluster.map((p) => `${p.emoji} ${escapeHtml(p.name)}`).join(' · ');
          return `
            <article class="card colony-card">
              <div class="card-top">
                <div>
                  <div class="emoji">${cluster.map((p) => p.emoji).join('')}</div>
                  <h3>${lead.species} ×${cluster.length}</h3>
                </div>
                <div class="tag good">${cluster.length}/${COLONY_PER_KENNEL}</div>
              </div>
              <p class="card-note">${kennelNote}</p>
              <div class="tags"><span class="tag">${names}</span></div>
              <div class="actions">
                <button class="btn small" data-accept="${lead.id}">Take group</button>
                <button class="btn small ghost" data-decline="${lead.id}">Pass</button>
              </div>
            </article>`;
        })
        .join('')
    : `<p style="color:var(--muted);margin:0">Empty queue</p>`;

  const housed = s.pets.map((p) => petCard(p, habitatTag(s.pets, p.species) ? `<p class="card-note">${habitatTag(s.pets, p.species)}</p>` : '')).join('');

  return `
    <section class="panel">
      <header>
        <div>
          <h2>Intake</h2>
          <p>Take them in or pass. Small pets share habitats.</p>
        </div>
      </header>
      <div class="grid intake">${incoming}</div>
      <h3 style="margin:1rem 0 .5rem">Kennels</h3>
      <div class="grid pets">${housed || '<p style="color:var(--muted)">Empty</p>'}</div>
      <div class="row-actions">
        <button class="btn" id="to-care">Care</button>
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
          <h2>Care</h2>
          <p>⚡ ${s.energy} · 🥫 ${s.supplies}</p>
        </div>
      </header>
      <div class="grid pets">${cards || '<p>No pets</p>'}</div>
      <div class="row-actions">
        <button class="btn" id="to-adopt">Match</button>
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
          <h2>Match</h2>
          <p>Pick a pet for each visitor.</p>
        </div>
      </header>
      <div class="grid adopters">${cards}</div>
      <div class="row-actions">
        <button class="btn" id="finish-adopt">Close desk</button>
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
          <h2>Upgrade</h2>
          <p>Pick one.</p>
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
    ? `${s.adoptions} homes · ${s.reputation} rep`
    : `Need 6 homes + 40 rep · now ${s.adoptions} / ${s.reputation}`;
  const nextLabel = s.endless ? 'Next day' : s.day >= s.maxDays ? 'Results' : 'Next day';
  const cost = restockCost();
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Day ${s.day}${s.endless ? ' · Endless' : ''}</h2>
          <p>${blurb}</p>
        </div>
      </header>
      <div class="tags">${relics}</div>
      <p style="color:var(--muted);margin:0.85rem 0 0;font-weight:700">🥫 ${s.supplies} · 🪙 ${s.gold}</p>
      <div class="row-actions">
        <button class="btn ghost" id="buy-food" ${s.gold < cost ? 'disabled' : ''}>+3 food (${cost}🪙)</button>
        <button class="btn" id="next-day">${nextLabel}</button>
        ${s.endless ? '<button class="btn ghost" id="retire-endless">Retire</button>' : ''}
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
      if (confirm('Retire this endless run?')) retireEndless();
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
