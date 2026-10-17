"""Sync configured public Steam libraries; credentials are read only from environment."""
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def request_api(interface, method, key, **params):
    query = urlencode({"key": key, **params})
    url = f"https://api.steampowered.com/{interface}/{method}/v0001/?{query}"
    try:
        with urlopen(url, timeout=30) as response:
            return json.load(response)
    except (HTTPError, URLError, TimeoutError, ValueError):
        # Do not include the URL or exception: it may contain the API key.
        raise RuntimeError("Steam API 请求失败，请检查密钥、网络和接口状态") from None


def sync():
    configs = json.loads((ROOT / "accounts.json").read_text(encoding="utf-8"))["accounts"]
    if not configs:
        raise RuntimeError("请先在 accounts.json 配置至少一个账号")
    key = os.environ.get("STEAM_API_KEY", "").strip()
    if not key:
        raise RuntimeError("缺少 STEAM_API_KEY 环境变量")
    output = []
    seen = set()
    for config in configs:
        steamid = str(config.get("steamid", ""))
        if not re.fullmatch(r"[0-9]{17}", steamid) or steamid in seen:
            raise RuntimeError("账号 ID 必须是唯一的 17 位 SteamID64")
        seen.add(steamid)
        library = request_api("IPlayerService", "GetOwnedGames", key, steamid=steamid,
                              include_appinfo=1, include_played_free_games=1).get("response", {})
        if "game_count" not in library:
            raise RuntimeError(f"账号 {steamid} 未返回游戏库，请检查个人资料及游戏详情公开设置")
        games = library.get("games", [])
        if len(games) != library["game_count"]:
            raise RuntimeError(f"账号 {steamid} 游戏数量异常，本次保留旧数据")
        players = request_api("ISteamUser", "GetPlayerSummaries", key,
                              steamids=steamid).get("response", {}).get("players", [])
        if not players:
            raise RuntimeError(f"账号 {steamid} 未返回个人资料")
        player = players[0]
        output.append({"steamid": steamid, "name": config.get("name") or player.get("personaname", steamid),
                       "games": [{"appid": g["appid"], "name": g.get("name") or str(g["appid"]),
                                  "playtime_minutes": g.get("playtime_forever", 0),
                                  "recent_minutes": g.get("playtime_2weeks", 0)} for g in games]})
    target = ROOT / "data" / "library.json"
    target.parent.mkdir(exist_ok=True)
    temporary = target.with_suffix(".tmp")
    temporary.write_text(json.dumps({"updated_at": datetime.now(timezone.utc).isoformat(), "accounts": output},
                                     ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(target)
    print(f"同步成功：{len(output)} 个账号")


if __name__ == "__main__":
    try:
        sync()
    except (RuntimeError, KeyError, TypeError, OSError, ValueError) as error:
        print(f"同步失败：{error}", file=sys.stderr)
        sys.exit(1)
