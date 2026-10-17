# Steam 游戏馆

展示指定 Steam 账号的游戏库，支持账号切换、游戏搜索、游玩时长排序、最近两周排序、未游玩筛选和移动端布局。无前端构建依赖，无数据库。实际数据来自 Steam Web API，不包含示例账号或虚构游戏。

## 配置账号

编辑根目录 `accounts.json`，使用字符串格式的 17 位 SteamID64（不要填登录账号或密码）：

```json
{
  "accounts": [
    { "steamid": "替换成17位SteamID64", "name": "我的游戏库" }
  ]
}
```

可添加多个账号；`name` 可省略，省略则使用 Steam 昵称。账号的个人资料及游戏详情应对外公开。私密库、家庭共享库、未实际拥有的游戏不能保证被接口返回；已玩过的免费游戏包含在同步范围。

## GitHub Pages 免费部署

本项目已配置 SteamID64 `76561198286857637`（https://steamcommunity.com/profiles/76561198286857637/）。GitHub 目标用户为 `youbestl`，建议仓库名 `steam-library`。如果使用这个仓库名，部署成功后的预期地址为 `https://youbestl.github.io/steam-library/`，单账号分享地址为 `https://youbestl.github.io/steam-library/account.html?id=76561198286857637`。这些是预期地址，尚未创建仓库或完成部署。

1. 在你的 GitHub 下创建公开仓库，将本目录上传到 `main` 分支。
2. 在 Steam 官方 https://steamcommunity.com/dev/apikey 申请 Web API Key。不要发给他人，不要写进源码。
3. GitHub 仓库 → Settings → Secrets and variables → Actions → New repository secret，名称 `STEAM_API_KEY`，值填写你的 Key。
4. 仓库 → Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
5. 配好账号后，在 Actions 中手动执行 **Sync Steam library and deploy Pages**。
6. 成功后，在 Pages 设置或工作流 deployment 输出中获取实际网址，通常为 `https://你的用户名.github.io/仓库名/`。

每六小时触发同步（UTC 00:23、06:23、12:23、18:23，对应北京时间 08:23、14:23、20:23、次日 02:23）。GitHub 定时任务可能延迟，不属于严格实时刷新。公开仓库长期无活动可能停用定时任务，需要重新启用。

同步失败会使工作流失败，已有线上版本继续保留。成功数据直接打包部署，不自动提交回源码仓库。第一次部署前必须配置账号和 Secret。公开访问者能看到配置账号的游戏列表及游玩时长。

分享某个账号：`/?id=17位SteamID64`；部署产物也包含兼容入口 `account.html?id=17位SteamID64`。这里的 id 是真实 SteamID64，不是参考站的内部编号。

## 国内访问边界

GitHub Pages 提供免费默认域名，但无法保证中国大陆各运营商稳定访问。本项目不承诺仅靠免费默认域名达到国内稳定可用。

如果 Pages 实际访问不佳，可将同一份静态产物迁移到其他静态托管。EdgeOne Pages / Makers 的官方域名说明目前要求中国大陆通过临时预览链接访问默认域名，预览链接仅 3 小时有效，因此不适合作为无需自有域名的长期地址。绑定自有域名通常涉及域名费用；使用大陆节点还需备案。

页面的 JS/CSS 和游戏库 JSON 均使用站内地址，无外部字体或 JS CDN。游戏封面直接读取 Steam CDN，失败后显示文字封面，不影响搜索及列表；Steam 商店跳转的可访问性取决于用户网络。

官方参考：
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://pages.edgeone.ai/document/domain-overview
- https://partner.steamgames.com/doc/webapi/IPlayerService

## 本地运行（Windows / PowerShell）

在项目根目录运行：

```powershell
& C:\softs\miniconda3\python.exe -m http.server 8080 --bind 127.0.0.1
```

访问 http://127.0.0.1:8080 。不要直接双击 HTML（浏览器可能禁止读取 JSON）。初始未配置账号会显示真实空状态。

本地同步时，由当前进程环境提供 `STEAM_API_KEY`，然后运行：

```powershell
& C:\softs\miniconda3\python.exe scripts/sync_library.py
```

不要把含真实密钥的命令保存到仓库或提交历史。GitHub 托管的 Ubuntu runner 使用工作流单独配置的 Python 3.12，本地仅使用 conda base。
