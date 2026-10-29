# Kaşgarlı haritası görsellerini Wikimedia Commons'tan img/ klasörüne indirir.
# Kullanım (proje klasöründe): powershell -ExecutionPolicy Bypass -File tools\gorselleri-indir.ps1
$ErrorActionPreference = 'Stop'
$img = Join-Path $PSScriptRoot '..\img'
New-Item -ItemType Directory -Force $img | Out-Null
$ua = @{ 'User-Agent' = 'KasgarliAtlas/1.0 (egitim amacli)' }
Invoke-WebRequest -Headers $ua -Uri 'https://commons.wikimedia.org/wiki/Special:FilePath/D%C4%ABw%C4%81n_Lugh%C4%81t_al-Turk_(original).jpg?width=2000' -OutFile (Join-Path $img 'original.jpg')
Invoke-WebRequest -Headers $ua -Uri 'https://commons.wikimedia.org/wiki/Special:FilePath/Mahmud_al-Kashgari_map_(T%C3%BCrk%C3%A7e).png?width=2000' -OutFile (Join-Path $img 'turkce.png')
Get-ChildItem $img
