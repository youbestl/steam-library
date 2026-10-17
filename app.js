'use strict';
const $ = (id) => document.getElementById(id);
let library = { accounts: [] };
let limit = 48;
const hours = (minutes) => (minutes / 60).toLocaleString('zh-CN', { maximumFractionDigits: 1 });
function render() {
  const account = library.accounts.find((item) => item.steamid === $('account').value);
  const games = account?.games || [];
  $('count').textContent = games.length;
  $('hours').textContent = hours(games.reduce((sum, game) => sum + game.playtime_minutes, 0));
  $('unplayed').textContent = games.filter((game) => !game.playtime_minutes).length;
  const query = $('search').value.trim().toLocaleLowerCase();
  const filter = $('filter').value;
  const visible = games.filter((game) => (game.name.toLocaleLowerCase().includes(query) || String(game.appid).includes(query)) && (filter === 'all' || (filter === 'played' ? game.playtime_minutes > 0 : !game.playtime_minutes)));
  visible.sort((a, b) => $('sort').value === 'name' ? a.name.localeCompare(b.name, 'zh-CN') : $('sort').value === 'recent' ? b.recent_minutes - a.recent_minutes : b.playtime_minutes - a.playtime_minutes);
  $('result-count').textContent = ` / ${visible.length}`;
  $('status').textContent = !account ? '还没有游戏库。配置 Steam 账号并完成首次同步后，收藏会显示在这里。' : !visible.length ? '没有找到符合条件的游戏。' : '';
  const fragment = document.createDocumentFragment();
  for (const game of visible.slice(0, limit)) {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `https://store.steampowered.com/app/${Number(game.appid)}/`;
    card.target = '_blank'; card.rel = 'noopener noreferrer';
    const cover = document.createElement('div'); cover.className = 'cover';
    const fallback = document.createElement('span'); fallback.textContent = game.name;
    const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy';
    image.src = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${Number(game.appid)}/header.jpg`;
    image.addEventListener('error', () => image.remove(), { once: true });
    cover.append(fallback, image);
    const title = document.createElement('h3'); title.textContent = game.name;
    const detail = document.createElement('p'); detail.textContent = game.playtime_minutes ? `已游玩 ${hours(game.playtime_minutes)} 小时` : '尚未开始 · 等待探索';
    card.append(cover, title, detail); fragment.append(card);
  }
  $('games').replaceChildren(fragment);
  $('more').hidden = visible.length <= limit;
}
for (const id of ['search', 'sort', 'filter', 'account']) {
  $(id).addEventListener(id === 'search' ? 'input' : 'change', () => {
    limit = 48;
    if (id === 'account') {
      const url = new URL(location.href); url.searchParams.set('id', $('account').value); history.replaceState(null, '', url);
    }
    render();
  });
}
$('more').addEventListener('click', () => { limit += 48; render(); });
fetch('./data/library.json', { cache: 'no-cache' }).then((response) => {
  if (!response.ok) throw new Error('load');
  return response.json();
}).then((data) => {
  if (!Array.isArray(data.accounts)) throw new Error('format');
  library = data;
  $('account').replaceChildren(...data.accounts.map((account) => {
    const option = document.createElement('option'); option.value = account.steamid; option.textContent = account.name; return option;
  }));
  const selected = new URLSearchParams(location.search).get('id');
  if (data.accounts.some((account) => account.steamid === selected)) $('account').value = selected;
  if (data.updated_at) $('updated').textContent = `更新于 ${new Date(data.updated_at).toLocaleString('zh-CN')}`;
  render();
}).catch(() => { $('status').textContent = '游戏库读取失败，请刷新重试；如持续失败，请检查数据文件是否正确发布。'; });
