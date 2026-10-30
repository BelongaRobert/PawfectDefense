import './style.css';
import { initNativeShell } from './native';
import { cardName, cardText, getCard } from './game/cards';
import { intentView } from './game/combat';
import { getEncounter, getEnemy } from './game/encounters';
import {
  abandonRun,
  aimEnemy,
  bootToTitle,
  buyShopCard,
  buyShopPotion,
  buyShopRelic,
  canUpgrade,
  cancelPicker,
  cardEnergy,
  cardPlayable,
  chooseBossRelic,
  chooseEvent,
  chooseNode,
  confirmRemove,
  confirmUpgrade,
  continueRun,
  copyRestoreCode,
  createShelterAccount,
  deviceUsernames,
  drinkPotion,
  eventPresentation,
  exhaustChoice,
  finishTurn,
  getAccountNotice,
  getProfile,
  getSaveFlash,
  getSignedInUsername,
  getState,
  hasBackupPassword,
  isLoggedIn,
  leaveReward,
  leaveShop,
  loginShelterAccount,
  logoutShelterAccount,
  nudgeLoginToSave,
  openUpgradePicker,
  playHandCard,
  POTIONS,
  restHeal,
  restoreShelterAccount,
  shopRemove,
  skipRewardCard,
  startRun,
  subscribe,
  takeRewardCard,
  unlockShelterBackup,
  updatePlayerName,
} from './game/game';
import { UNLOCKS, xpToNextLevel } from './game/progression';
import { getRelic } from './game/relics';
import { continueSummary, hasContinue } from './game/save';
import type { CardInstance, CombatState, MapNode, RunState } from './game/types';

void initNativeShell();

const app = document.querySelector<HTMLDivElement>('#app')!;

/** Pile and shop-remove sheets are UI-only. They are not part of the save. */
let sheet: { title: string; cards: CardInstance[]; pick: 'shop-remove' | null } | null = null;

bootToTitle();
subscribe(() => {
  sheet = null;
  render();
});
app.addEventListener('click', onClick);
render();

function onClick(event: MouseEvent): void {
  const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-act]');
  if (!el || !app.contains(el)) return;
  const act = el.dataset.act || '';
  const id = el.dataset.id || '';
  const index = Number(el.dataset.index ?? '-1');
  if (act === 'close-sheet') {
    sheet = null;
    render();
    return;
  }
  if (act === 'show-deck') {
    const s = getState();
    sheet = { title: `Deck · ${s.deck.length}`, cards: s.deck, pick: null };
    render();
    return;
  }
  if (act === 'show-pile') {
    const combat = getState().combat;
    if (!combat) return;
    const pile = el.dataset.pile;
    if (pile === 'draw') sheet = { title: `Draw · ${combat.draw.length}`, cards: [...combat.draw].reverse(), pick: null };
    if (pile === 'discard') sheet = { title: `Discard · ${combat.discard.length}`, cards: combat.discard, pick: null };
    if (pile === 'exhaust') sheet = { title: `Exhaust · ${combat.exhaustPile.length}`, cards: combat.exhaustPile, pick: null };
    render();
    return;
  }
  if (act === 'shop-remove-open') {
    sheet = { title: 'Remove a card', cards: getState().deck, pick: 'shop-remove' };
    render();
    return;
  }
  if (act === 'node') chooseNode(id);
  else if (act === 'play') playHandCard(id);
  else if (act === 'enemy') aimEnemy(id);
  else if (act === 'exhaust') exhaustChoice(id);
  else if (act === 'end-turn') finishTurn();
  else if (act === 'potion') drinkPotion();
  else if (act === 'take-card') takeRewardCard(id);
  else if (act === 'skip-reward') skipRewardCard();
  else if (act === 'leave-reward') leaveReward();
  else if (act === 'boss-relic') chooseBossRelic(id);
  else if (act === 'rest-heal') restHeal();
  else if (act === 'rest-upgrade') openUpgradePicker();
  else if (act === 'upgrade') confirmUpgrade(id);
  else if (act === 'remove') confirmRemove(id);
  else if (act === 'cancel-picker') cancelPicker();
  else if (act === 'buy-card') buyShopCard(index);
  else if (act === 'buy-relic') buyShopRelic(index);
  else if (act === 'buy-potion') buyShopPotion();
  else if (act === 'shop-remove') shopRemove(id);
  else if (act === 'leave-shop') leaveShop();
  else if (act === 'event-choice') chooseEvent(id);
  else if (act === 'menu') {
    const guest = !isLoggedIn();
    const msg = guest ? 'Leave this guest run? It will be lost.' : 'Return to the menu? This run stays saved.';
    if (confirm(msg)) bootToTitle();
  } else if (act === 'again') startRun();
  else if (act === 'to-title') bootToTitle();
  else if (act === 'login-hint') nudgeLoginToSave();
}

function render(): void {
  const s = getState();
  if (sheet?.pick === 'shop-remove' && s.phase !== 'shop') sheet = null;
  if (sheet && !sheet.pick && s.phase !== 'combat' && !sheet.title.startsWith('Deck')) sheet = null;

  if (s.phase === 'title') {
    app.innerHTML = renderTitle();
    bindTitle();
    return;
  }
  if (s.phase === 'victory' || s.phase === 'ended') {
    app.innerHTML = renderEnded(s);
    return;
  }

  app.innerHTML = `
    <div class="run">
      ${renderHud(s)}
      ${renderPhase(s)}
      ${renderSheet()}
    </div>
  `;
}

function renderTitle(): string {
  const profile = getProfile();
  const signedIn = isLoggedIn();
  const cont = signedIn ? continueSummary() : null;
  const stats = profile.stats;
  const xp = xpToNextLevel(profile.xp || 0);
  const pct = Math.min(100, Math.round((xp.into / xp.need) * 100));
  const nextUnlock = UNLOCKS.find((u) => !(profile.unlocks || []).includes(u.id));
  const owned = UNLOCKS.filter((u) => (profile.unlocks || []).includes(u.id));
  const user = getSignedInUsername();
  const notice = getAccountNotice();
  const onDevice = deviceUsernames();

  return `
    <section class="title-screen shell">
      <div class="title-hero">
        <h1>Pawfect Shelter</h1>
        <button class="info-btn" id="info-toggle" type="button" aria-expanded="false" aria-controls="info-bubble" title="How to play">i</button>
      </div>
      <div class="info-bubble" id="info-bubble" hidden>
        <p>Three acts. One kennel lead. A real fight.</p>
        <p>Spend energy on Attacks, Skills, and Powers. Block lasts through the enemy turn.</p>
        <p>Enemies show the hit before they take it. Draft toward Strength, Block, or Vulnerable.</p>
        <p>Guest play is temporary. Log in to keep XP and Continue.</p>
      </div>

      ${
        signedIn
          ? `<div class="profile-card compact">
              <div class="profile-card-title">Lv ${profile.level || 1} · @${escapeHtml(user || '')}</div>
              <div class="xp-bar" aria-label="Shelter XP"><span style="width:${pct}%"></span></div>
              <div class="profile-stats">
                <span>${stats.seasonsWon} wins</span>
                <span>Best act ${stats.bestAct || 0}</span>
                <span>${stats.elitesDefeated} elites</span>
                ${nextUnlock ? `<span>Next: Lv ${nextUnlock.level} ${nextUnlock.emoji}</span>` : ''}
              </div>
              ${
                owned.length
                  ? `<div class="unlock-row">${owned.map((u) => `<span class="tag good">${u.emoji} ${escapeHtml(u.name)}</span>`).join('')}</div>`
                  : ''
              }
            </div>`
          : ''
      }

      ${
        cont
          ? `<div class="continue-card">
              <div class="continue-line">Act ${cont.act} · ${cont.hp} HP · ${cont.gold} gold</div>
              <div class="row-actions" style="margin-top:.55rem">
                <button class="btn" id="continue">Continue</button>
                <button class="btn secondary" id="abandon">Quit save</button>
              </div>
            </div>`
          : ''
      }

      ${renderRewardBlock()}

      <div class="row-actions play-row">
        <button class="btn play-btn" id="start">${cont ? 'New run' : 'Play'}</button>
      </div>

      <details class="account-drawer" ${!signedIn || notice ? 'open' : ''}>
        <summary>${signedIn ? `Account · @${escapeHtml(user || '')}` : 'Log in to save'}</summary>
        ${notice ? `<div class="account-notice">${escapeHtml(notice)}</div>` : ''}
        ${
          signedIn
            ? `<label class="profile-field">
                 <span>Name</span>
                 <input id="player-name" type="text" maxlength="24" placeholder="Manager"
                   value="${escapeHtml(profile.name)}" autocomplete="nickname" />
               </label>
               <div class="row-actions" style="margin-top:.55rem">
                 <button class="btn small secondary" id="logout" type="button">Log out</button>
               </div>
               <details class="restore-fold">
                 <summary>Backup for another phone</summary>
                 ${
                   hasBackupPassword()
                     ? ''
                     : `<label class="profile-field">
                          <span>Password</span>
                          <input id="unlock-pass" type="password" autocomplete="current-password" />
                        </label>
                        <div class="row-actions" style="margin-top:.45rem">
                          <button class="btn small secondary" id="unlock-backup" type="button">Unlock</button>
                        </div>`
                 }
                 <div class="row-actions" style="margin-top:.45rem">
                   <button class="btn small" id="copy-restore" type="button">Copy backup</button>
                 </div>
                 <input id="restore-out" class="restore-line" type="text" readonly hidden />
               </details>`
            : `<p class="account-hint">Username + password. No email.</p>
               <label class="profile-field">
                 <span>Username</span>
                 <input id="acct-user" type="text" maxlength="20" autocomplete="username" />
               </label>
               <label class="profile-field">
                 <span>Password</span>
                 <input id="acct-pass" type="password" autocomplete="new-password" />
               </label>
               <div class="row-actions" style="margin-top:.55rem">
                 <button class="btn small" id="acct-create" type="button">Create account</button>
                 <button class="btn small secondary" id="acct-login" type="button">Log in</button>
               </div>
               ${onDevice.length ? `<div class="profile-stats" style="margin-top:.5rem">${onDevice.map((n) => `<span>@${escapeHtml(n)}</span>`).join('')}</div>` : ''}
               <details class="restore-fold">
                 <summary>Have a backup?</summary>
                 <label class="profile-field">
                   <span>Paste backup</span>
                   <input id="restore-in" class="restore-line" type="text" placeholder="PFS1...." autocomplete="off" />
                 </label>
                 <label class="profile-field">
                   <span>Password</span>
                   <input id="restore-pass" type="password" autocomplete="current-password" />
                 </label>
                 <div class="row-actions" style="margin-top:.45rem">
                   <button class="btn small secondary" id="acct-restore" type="button">Restore</button>
                 </div>
               </details>
               <input id="player-name" type="hidden" value="${escapeHtml(profile.name)}" />`
        }
      </details>
    </section>
  `;
}

function bindTitle(): void {
  const infoBtn = document.getElementById('info-toggle');
  const bubble = document.getElementById('info-bubble');
  infoBtn?.addEventListener('click', () => {
    if (!bubble || !infoBtn) return;
    const open = bubble.hasAttribute('hidden');
    if (open) bubble.removeAttribute('hidden');
    else bubble.setAttribute('hidden', '');
    infoBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

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
    const box = document.getElementById('restore-out') as HTMLInputElement | null;
    if (!code || !box) return;
    box.hidden = false;
    box.value = code;
    box.focus();
    box.select();
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* the field stays selected */
    }
  });
  document.getElementById('acct-restore')?.addEventListener('click', () => {
    const code = (document.getElementById('restore-in') as HTMLInputElement | null)?.value || '';
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

function renderEnded(s: RunState): string {
  const profile = getProfile();
  const title = s.phase === 'victory' ? 'The kennel holds' : s.won ? 'Nice run.' : 'Run over.';
  return `
    <section class="ended shell ${s.phase === 'victory' ? 'victory-screen' : ''}">
      <h1>${title}</h1>
      <p>${escapeHtml(s.endReason ?? '')}</p>
      <p>Act ${s.act} · ${s.fightsWon} fights · ${s.elitesWon} elites · ${s.floors} rooms</p>
      ${renderRewardBlock()}
      <p class="ended-profile">Lv ${profile.level} · ${profile.xp} XP</p>
      <div class="row-actions">
        <button class="btn" data-act="again" type="button">Play again</button>
        <button class="btn secondary" data-act="to-title" type="button">Menu</button>
      </div>
    </section>
  `;
}

function renderHud(s: RunState): string {
  const profile = getProfile();
  const flash = getSaveFlash();
  const potion = s.potion ? POTIONS[s.potion] : null;
  const relics = s.relics
    .map((id) => {
      const relic = getRelic(id);
      return relic ? `<span class="relic-pip" title="${escapeHtml(relic.name)}: ${escapeHtml(relic.description)}">${relic.emoji}</span>` : '';
    })
    .join('');
  return `
    <header class="run-hud">
      <div class="brand-lockup">
        <div class="eyebrow">Act ${s.act}${profile.name ? ` · ${escapeHtml(profile.name)}` : ''}</div>
        <h1>Pawfect Shelter</h1>
        ${flash ? `<div class="save-flash">${escapeHtml(flash)}</div>` : ''}
      </div>
      <div class="meters">
        <div class="meter">❤️ ${s.hp}/${s.maxHp}</div>
        <div class="meter">🪙 ${s.gold}</div>
        <div class="meter" title="${potion ? escapeHtml(potion.text) : 'Empty potion slot'}">${potion ? `${potion.emoji} ${escapeHtml(potion.name)}` : '🧪 —'}</div>
        <button class="meter meter-btn" type="button" data-act="show-deck">Deck ${s.deck.length}</button>
        ${
          isLoggedIn()
            ? ''
            : '<button class="meter meter-btn" type="button" data-act="login-hint">Log in</button>'
        }
        <button class="meter meter-btn" type="button" data-act="menu">Menu</button>
      </div>
      <div class="relic-row">${relics}</div>
    </header>
  `;
}

function renderPhase(s: RunState): string {
  if (s.phase === 'map') return renderMap(s);
  if (s.phase === 'combat' && s.combat) return renderCombat(s.combat);
  if (s.phase === 'reward' && s.reward) return renderReward(s);
  if (s.phase === 'rest') return renderRest(s);
  if (s.phase === 'shop' && s.shop) return renderShop(s);
  if (s.phase === 'event') return renderEvent(s);
  if (s.phase === 'relic') return renderBossRelic(s);
  return '';
}

const NODE_FACE: Record<MapNode['kind'], { emoji: string; label: string }> = {
  combat: { emoji: '🐾', label: 'Fight' },
  elite: { emoji: '⚠️', label: 'Elite' },
  rest: { emoji: '🔥', label: 'Rest' },
  shop: { emoji: '🛒', label: 'Shop' },
  event: { emoji: '❓', label: '?' },
  boss: { emoji: '👑', label: 'Boss' },
};

function nodeTitle(node: MapNode): string {
  if (node.kind === 'boss' && node.encounterId) {
    const encounter = getEncounter(node.encounterId);
    return encounter.enemies.map((e) => e.name ?? getEnemy(e.defId).name).join(' & ');
  }
  return NODE_FACE[node.kind].label;
}

function renderMap(s: RunState): string {
  const lines: string[] = [];
  for (const node of s.map.nodes) {
    for (const nextId of node.next) {
      const next = s.map.nodes.find((n) => n.id === nextId);
      if (!next) continue;
      const x1 = ((node.col + 0.5) / 3) * 300;
      const y1 = ((7 - node.row + 0.5) / 8) * 800;
      const x2 = ((next.col + 0.5) / 3) * 300;
      const y2 = ((7 - next.row + 0.5) / 8) * 800;
      lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`);
    }
  }
  const rows: string[] = [];
  for (let row = 7; row >= 0; row--) {
    const slots = [0, 1, 2].map((col) => {
      const node = s.map.nodes.find((n) => n.row === row && n.col === col);
      return node ? mapNode(s, node) : '<div class="map-slot"></div>';
    });
    rows.push(`<div class="map-row">${slots.join('')}</div>`);
  }
  return `
    <section class="map-board panel" aria-label="Act ${s.act} map">
      <header>
        <div>
          <h2>Act ${s.act}</h2>
          <p>Pick an open room. The boss waits at the top.</p>
        </div>
      </header>
      <div class="map-grid">
        <svg class="map-lines" viewBox="0 0 300 800" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg>
        <div class="map-rows">${rows.join('')}</div>
      </div>
      ${renderLog(s.log)}
    </section>
  `;
}

function mapNode(s: RunState, node: MapNode): string {
  const open = s.reachable.includes(node.id);
  const done = s.cleared.includes(node.id);
  const face = NODE_FACE[node.kind];
  const cls = ['map-node', `kind-${node.kind}`, open ? 'is-open' : '', done ? 'is-done' : '', !open && !done ? 'is-locked' : '']
    .filter(Boolean)
    .join(' ');
  const label = node.kind === 'boss' ? nodeTitle(node) : face.label;
  return `
    <button class="${cls}" type="button" data-act="node" data-id="${escapeHtml(node.id)}" ${open ? '' : 'disabled'} title="${escapeHtml(label)}">
      <span class="map-emoji">${face.emoji}</span>
      <span class="map-label">${escapeHtml(label)}</span>
    </button>
  `;
}

function renderCombat(combat: CombatState): string {
  const pending = combat.pending;
  const prompt =
    pending?.type === 'target'
      ? 'Choose an enemy. Tap the card again to cancel.'
      : pending?.type === 'potion'
        ? 'Choose an enemy for the potion.'
        : pending?.type === 'exhaust'
          ? 'Exhaust a card from your hand.'
          : combat.doubleNextAttack
            ? 'Your next Attack plays twice.'
            : '';
  const enemies = combat.enemies
    .map((enemy) => {
      const alive = enemy.hp > 0;
      const intent = alive ? intentView(enemy, combat.player) : null;
      const pct = Math.max(0, Math.min(100, Math.round((enemy.hp / enemy.maxHp) * 100)));
      const aiming = alive && (pending?.type === 'target' || pending?.type === 'potion');
      return `
        <article class="enemy ${alive ? '' : 'is-down'} ${aiming ? 'is-aim' : ''}">
          <button class="enemy-hit" type="button" data-act="enemy" data-id="${escapeHtml(enemy.uid)}" ${aiming ? '' : 'disabled'}>
            <div class="enemy-top">
              <span class="emoji">${enemy.emoji}</span>
              <div>
                <h3>${escapeHtml(enemy.name)}</h3>
                <div class="hpnum">${Math.max(0, enemy.hp)}/${enemy.maxHp}</div>
              </div>
            </div>
            <div class="hpbar"><span style="width:${pct}%"></span></div>
            ${intent ? `<div class="intent intent-${intent.tone}">${escapeHtml(intent.label)} <strong>${escapeHtml(intent.value)}</strong></div>` : '<div class="intent">Down</div>'}
            <div class="chips">${statusChips(enemy)}</div>
          </button>
        </article>
      `;
    })
    .join('');

  const hand = combat.hand
    .map((card) => {
      if (pending?.type === 'exhaust') {
        return playCardFace(card, { act: 'exhaust', selected: false, disabled: false });
      }
      const selected = pending?.type === 'target' && pending.cardUid === card.uid;
      const playable = cardPlayable(combat, card);
      return playCardFace(card, { act: 'play', selected, disabled: !playable && !selected });
    })
    .join('');

  const potion = getState().potion;
  const potionMeta = potion ? POTIONS[potion] : null;
  const playerPct = Math.max(0, Math.min(100, Math.round((combat.player.hp / combat.player.maxHp) * 100)));

  return `
    <section class="combat" aria-label="Combat">
      <div class="enemy-row">${enemies}</div>
      ${prompt ? `<p class="combat-prompt">${escapeHtml(prompt)}</p>` : ''}
      <div class="you-bar">
        <div>
          <div class="hpnum">You ${combat.player.hp}/${combat.player.maxHp}</div>
          <div class="hpbar you"><span style="width:${playerPct}%"></span></div>
          <div class="chips">${statusChips(combat.player)}</div>
        </div>
        <div class="energy" aria-label="Energy">${combat.player.energy}<span>/${combat.player.maxEnergy}</span></div>
        <button class="btn small ${potionMeta ? '' : 'secondary'}" type="button" data-act="potion" ${potionMeta && !pending ? '' : 'disabled'} title="${potionMeta ? escapeHtml(potionMeta.text) : 'No potion'}">
          ${potionMeta ? `${potionMeta.emoji} ${escapeHtml(potionMeta.name)}` : 'No potion'}
        </button>
      </div>
      <div class="pile-row">
        <button class="pile" type="button" data-act="show-pile" data-pile="draw">Draw ${combat.draw.length}</button>
        <button class="pile" type="button" data-act="show-pile" data-pile="discard">Discard ${combat.discard.length}</button>
        <button class="pile" type="button" data-act="show-pile" data-pile="exhaust">Exhaust ${combat.exhaustPile.length}</button>
        <button class="btn end-turn" type="button" data-act="end-turn" ${pending || combat.over ? 'disabled' : ''}>End turn</button>
      </div>
      <div class="combat-hand">${hand || '<p class="empty-hand">Hand empty</p>'}</div>
      ${renderLog(combat.log)}
    </section>
  `;
}

function playCardFace(card: CardInstance, opts: { act: string; selected: boolean; disabled: boolean }): string {
  return cardFace(card, {
    act: opts.act,
    id: card.uid,
    selected: opts.selected,
    disabled: opts.disabled,
    extra: '',
  });
}

function cardFace(
  card: CardInstance,
  opts: { act?: string; id?: string; index?: number; selected?: boolean; disabled?: boolean; extra?: string },
): string {
  const def = getCard(card.defId);
  if (!def) return '';
  const cost = cardEnergy(card);
  const tag = opts.act ? 'button' : 'article';
  const attrs = [
    opts.act ? `data-act="${opts.act}"` : '',
    opts.id ? `data-id="${escapeHtml(opts.id)}"` : '',
    opts.index != null ? `data-index="${opts.index}"` : '',
    opts.disabled ? 'disabled' : '',
    tag === 'button' ? 'type="button"' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const cls = [
    'pcard',
    `r-${def.rarity}`,
    `t-${def.type}`,
    opts.selected ? 'is-selected' : '',
    opts.disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `
    <${tag} class="${cls}" ${attrs}>
      <span class="pcard-cost">${cost}</span>
      <span class="pcard-emoji">${def.emoji}</span>
      <span class="pcard-name">${escapeHtml(cardName(card))}</span>
      <span class="pcard-type">${typeLabel(def.type)}</span>
      <span class="pcard-text">${escapeHtml(cardText(card))}</span>
      ${opts.extra ?? ''}
    </${tag}>
  `;
}

function previewCard(defId: string, opts: { act?: string; id?: string; index?: number; disabled?: boolean; extra?: string }): string {
  return cardFace({ uid: defId, defId, upgraded: false }, opts);
}

function renderReward(s: RunState): string {
  const reward = s.reward!;
  const relic = reward.relicId ? getRelic(reward.relicId) : null;
  const cards = reward.cardDone
    ? ''
    : reward.cards
        .map((id) => previewCard(id, { act: 'take-card', id, extra: '<span class="pcard-price">Take</span>' }))
        .join('');
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Victory</h2>
          <p>+${reward.gold} gold${relic ? ` · ${relic.emoji} ${escapeHtml(relic.name)}` : ''}</p>
        </div>
      </header>
      ${relic ? `<p class="card-note">${escapeHtml(relic.description)}</p>` : ''}
      ${
        reward.cardDone
          ? '<p>Card reward settled.</p>'
          : `<div class="card-row">${cards}</div>
             <div class="row-actions"><button class="btn secondary" type="button" data-act="skip-reward">Skip card</button></div>`
      }
      ${
        reward.cardDone
          ? '<div class="row-actions"><button class="btn" type="button" data-act="leave-reward">Onward</button></div>'
          : ''
      }
      ${renderLog(s.log)}
    </section>
  `;
}

function renderRest(s: RunState): string {
  const heal = Math.floor(s.maxHp * 0.3);
  const upgradeable = s.deck.some(canUpgrade);
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Rest</h2>
          <p>One choice. Then the yard continues.</p>
        </div>
      </header>
      ${
        s.picker === 'upgrade'
          ? renderPicker(s, 'upgrade')
          : `<div class="row-actions">
              <button class="btn" type="button" data-act="rest-heal">Heal ${heal} HP</button>
              <button class="btn secondary" type="button" data-act="rest-upgrade" ${upgradeable ? '' : 'disabled'}>Upgrade a card</button>
            </div>`
      }
      ${renderLog(s.log)}
    </section>
  `;
}

function renderPicker(s: RunState, mode: 'upgrade' | 'remove'): string {
  const cards = s.deck
    .filter((card) => (mode === 'upgrade' ? canUpgrade(card) : true))
    .map((card) => cardFace(card, { act: mode, id: card.uid }))
    .join('');
  return `
    <p>${mode === 'upgrade' ? 'Choose a card to upgrade.' : 'Choose a card to remove.'}</p>
    <div class="card-row">${cards}</div>
    <div class="row-actions"><button class="btn ghost" type="button" data-act="cancel-picker">Back</button></div>
  `;
}

function renderShop(s: RunState): string {
  const shop = s.shop!;
  const cards = shop.cards
    .map((slot, index) =>
      previewCard(slot.item, {
        act: slot.sold ? undefined : 'buy-card',
        index,
        disabled: slot.sold || s.gold < slot.price,
        extra: `<span class="pcard-price">${slot.sold ? 'Sold' : `${slot.price}g`}</span>`,
      }),
    )
    .join('');
  const relics = shop.relics
    .map((slot, index) => {
      const relic = getRelic(slot.item);
      if (!relic) return '';
      const disabled = slot.sold || s.gold < slot.price;
      return `
        <button class="relic-card r-${relic.rarity}" type="button" data-act="buy-relic" data-index="${index}" ${disabled ? 'disabled' : ''}>
          <span class="emoji">${relic.emoji}</span>
          <strong>${escapeHtml(relic.name)}</strong>
          <span>${escapeHtml(relic.description)}</span>
          <em>${slot.sold ? 'Sold' : `${slot.price}g`}</em>
        </button>
      `;
    })
    .join('');
  const potion = shop.potion;
  const potionMeta = potion ? POTIONS[potion.item] : null;
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Shop</h2>
          <p>🪙 ${s.gold} gold · one potion slot</p>
        </div>
      </header>
      <div class="card-row">${cards}</div>
      <div class="relic-shop">${relics}</div>
      ${
        potion && potionMeta
          ? `<div class="row-actions">
              <button class="btn secondary" type="button" data-act="buy-potion" ${potion.sold || s.potion || s.gold < potion.price ? 'disabled' : ''}>
                ${potionMeta.emoji} ${escapeHtml(potionMeta.name)} · ${potion.sold ? 'Sold' : `${potion.price}g`}
              </button>
            </div>
            <p class="card-note">${escapeHtml(potionMeta.text)}</p>`
          : '<p class="card-note">Potion slot is full, so the counter skips it.</p>'
      }
      <div class="row-actions">
        <button class="btn secondary" type="button" data-act="shop-remove-open" ${s.deck.length <= 1 || s.gold < shop.removePrice ? 'disabled' : ''}>
          Remove a card · ${shop.removePrice}g
        </button>
        <button class="btn" type="button" data-act="leave-shop">Leave</button>
      </div>
      ${renderLog(s.log)}
    </section>
  `;
}

function renderEvent(s: RunState): string {
  if (s.picker === 'upgrade' || s.picker === 'remove') {
    return `<section class="panel"><h2>${s.picker === 'upgrade' ? 'Upgrade' : 'Remove'}</h2>${renderPicker(s, s.picker)}</section>`;
  }
  const view = eventPresentation();
  if (!view) return '<section class="panel"><p>The yard is quiet.</p></section>';
  const choices = view.choices
    .map((choice) => `<button class="btn" type="button" data-act="event-choice" data-id="${escapeHtml(choice.id)}">${escapeHtml(choice.label)}</button>`)
    .join('');
  return `
    <section class="panel">
      <header>
        <div>
          <div class="emoji">${view.emoji}</div>
          <h2>${escapeHtml(view.title)}</h2>
          <p>${escapeHtml(view.body)}</p>
        </div>
      </header>
      <div class="row-actions stack">${choices}</div>
      ${renderLog(s.log)}
    </section>
  `;
}

function renderBossRelic(s: RunState): string {
  const cards = s.relicChoices
    .map((id) => {
      const relic = getRelic(id);
      if (!relic) return '';
      return `
        <button class="relic-card r-${relic.rarity}" type="button" data-act="boss-relic" data-id="${escapeHtml(id)}">
          <span class="emoji">${relic.emoji}</span>
          <strong>${escapeHtml(relic.name)}</strong>
          <span>${escapeHtml(relic.description)}</span>
        </button>
      `;
    })
    .join('');
  return `
    <section class="panel">
      <header>
        <div>
          <h2>Boss relic</h2>
          <p>Take one. The next act will not wait.</p>
        </div>
      </header>
      <div class="relic-shop">${cards}</div>
      ${renderLog(s.log)}
    </section>
  `;
}

function renderSheet(): string {
  if (!sheet) return '';
  const cards = sheet.cards
    .map((card) =>
      cardFace(card, {
        act: sheet?.pick === 'shop-remove' ? 'shop-remove' : undefined,
        id: card.uid,
      }),
    )
    .join('');
  return `
    <div class="sheet-back">
      <button class="sheet-dismiss" type="button" data-act="close-sheet" aria-label="Close"></button>
      <div class="sheet-panel panel">
        <header>
          <h2>${escapeHtml(sheet.title)}</h2>
          <button class="btn small ghost" type="button" data-act="close-sheet">Close</button>
        </header>
        <div class="card-row">${cards || '<p>Empty.</p>'}</div>
      </div>
    </div>
  `;
}

function renderLog(lines: { text: string; tone?: string }[]): string {
  if (!lines.length) return '';
  return `
    <section class="log-panel" aria-label="Combat log">
      <ul class="log">
        ${lines
          .slice(0, 6)
          .map((line) => `<li class="${line.tone ?? 'neutral'}">${escapeHtml(line.text)}</li>`)
          .join('')}
      </ul>
    </section>
  `;
}

function statusChips(body: { block: number; strength: number; dexterity: number; weak: number; vulnerable: number; poison: number }): string {
  const bits: string[] = [];
  if (body.block > 0) bits.push(`🛡️ ${body.block}`);
  if (body.strength) bits.push(`💪 ${body.strength}`);
  if (body.dexterity) bits.push(`Dex ${body.dexterity}`);
  if (body.weak) bits.push(`Weak ${body.weak}`);
  if (body.vulnerable) bits.push(`Vuln ${body.vulnerable}`);
  if (body.poison) bits.push(`☠️ ${body.poison}`);
  return bits.map((bit) => `<span class="chip">${bit}</span>`).join('');
}

function typeLabel(type: string): string {
  if (type === 'attack') return 'Attack';
  if (type === 'skill') return 'Skill';
  if (type === 'power') return 'Power';
  return 'Curse';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
