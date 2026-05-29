# =====================================================================
# Launchia: OneDrive 同期から生成物を外すための junction セットアップ
# ---------------------------------------------------------------------
# 目的:
#   node_modules / .next / .wrangler / dist などの「バックアップ不要な
#   生成物」を OneDrive 外 (C:\dev\launchia-cache) に実体として置き、
#   OneDrive 配下にはリンク (junction) だけを残す。
#   これにより OneDrive の同期暴走 (CPU/メモリ 100%) を防ぐ。
#
# 使う場面:
#   - リポジトリを別 PC にクローンした直後
#   - cache を消した / junction が壊れた時
#
# 重要な順序:
#   npm install は junction を壊して実ディレクトリで作り直すため、
#   「先に npm install → 実体を cache へ Move → junction」の順で行う。
#   .next/.wrangler/dist はツールが中身を書くだけなので空 junction で良い。
#
# 使い方 (PowerShell):
#   1. OneDrive を一時停止 (タスクトレイ → 同期の一時停止)
#   2. このスクリプトを実行:
#        cd <repo>\launchia
#        pwsh -ExecutionPolicy Bypass -File scripts\setup-cache-junctions.ps1
#   3. OneDrive を再開
# =====================================================================

$ErrorActionPreference = "Stop"

# launchia ディレクトリ (このスクリプトの 1 つ上)
$base = Split-Path -Parent $PSScriptRoot
$cache = "C:\dev\launchia-cache"

Write-Host "launchia root : $base"
Write-Host "cache root    : $cache`n"

# node_modules: npm install 済みの実体を Move する対象
$nodeModules = @("api", "app", "widget")
# 空 junction で良い生成物 (ツールが中身を書く)
$emptyLinks = @(
  @{ app = "api";    name = ".wrangler" },
  @{ app = "app";    name = ".next" },
  @{ app = "widget"; name = "dist" }
)

$empty = "C:\dev\_empty_mirror"
New-Item -ItemType Directory -Force -Path $empty | Out-Null

function Purge-Dir($target) {
  if (-not (Test-Path -LiteralPath $target)) { return }
  $item = Get-Item -LiteralPath $target -Force
  $isReparse = ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
  if ($isReparse) {
    # junction / placeholder はリンクだけ削除
    [System.IO.Directory]::Delete($target, $false)
  } else {
    # 実ディレクトリ: robocopy ミラーで確実に空にしてから削除
    robocopy $empty $target /MIR /R:0 /W:0 /NFL /NDL /NJH /NJS /NP | Out-Null
    [System.IO.Directory]::Delete($target, $true)
  }
}

# --- node_modules: junction 先に実体が無ければ npm install を促す ---
foreach ($app in $nodeModules) {
  $src = Join-Path $base "$app\node_modules"
  $dst = Join-Path $cache "$app\node_modules"
  Write-Host "[node_modules] $app"

  $cacheHasContent = (Test-Path $dst) -and `
    ((Get-ChildItem -LiteralPath $dst -Force -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0)

  if ($cacheHasContent) {
    # cache に実体あり → src を junction に張り替えるだけ
    Purge-Dir $src
    New-Item -ItemType Junction -Path $src -Target $dst | Out-Null
    Write-Host "  -> junction restored (cache exists)"
  }
  elseif ((Test-Path $src) -and `
    -not ((Get-Item -LiteralPath $src -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    # src に実ディレクトリ (npm install 済み) → cache へ Move して junction
    if (Test-Path $dst) { [System.IO.Directory]::Delete($dst, $true) }
    New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
    Move-Item -LiteralPath $src -Destination $dst
    New-Item -ItemType Junction -Path $src -Target $dst | Out-Null
    Write-Host "  -> moved to cache + junction"
  }
  else {
    # どちらも無い → npm install が必要
    New-Item -ItemType Directory -Force -Path $dst | Out-Null
    Purge-Dir $src
    New-Item -ItemType Junction -Path $src -Target $dst | Out-Null
    Write-Host "  -> empty junction created. RUN: cd $app; npm install"
    Write-Host "     (install 後にこのスクリプトを再実行すると実体が cache に固定されます)"
  }
}

# --- .next / .wrangler / dist: 空 junction ---
foreach ($l in $emptyLinks) {
  $src = Join-Path $base "$($l.app)\$($l.name)"
  $dst = Join-Path $cache "$($l.app)\$($l.name)"
  Write-Host "[generated]    $($l.app)\$($l.name)"
  New-Item -ItemType Directory -Force -Path $dst | Out-Null
  Purge-Dir $src
  New-Item -ItemType Junction -Path $src -Target $dst | Out-Null
  Write-Host "  -> empty junction"
}

Write-Host "`n=== 完了 ==="
Write-Host "確認: 各 junction の Target が C:\dev\launchia-cache を指していれば成功"
