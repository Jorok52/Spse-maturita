import json, sys
base = sys.argv[1]
f = f"{base}/data/14.json"; d = json.load(open(f))
rows = [
 ["Co je ESP (EFI System Partition)?", "Speciální oddíl ve FAT32, ze kterého UEFI načítá zavaděče OS", "Rozšířený oddíl v MBR", "Záložní kopie GPT", "Oddíl pro swap"],
 ["Jaký souborový systém musí mít ESP?", "FAT32", "NTFS", "exFAT", "ext4"],
 ["Co obsahuje ESP?", "Zavaděče a boot manažery, např. /EFI/BOOT/bootx64.efi", "Uživatelské dokumenty", "Tabulku FAT", "Registr Windows"],
 ["Proč UEFI nenabootuje z oddílu NTFS?", "UEFI čte zavaděč jen z FAT32 (ESP)", "NTFS je moc rychlý", "NTFS nemá soubory", "UEFI neumí GPT"],
]
have = {q[0] for q in d['q']}
for r in rows:
    if r[0] not in have: d['q'].append(r)
d['open'].append({"q":"Vysvětli EFI System Partition a její souvislost s bootováním a instalací.","k":["ESP = oddíl ve FAT32 na disku s GPT","Obsahuje zavaděče a boot manažery (/EFI/BOOT/bootx64.efi, Windows Boot Manager)","UEFI boot manager najde ESP a spustí zavaděč","NTFS UEFI nepřečte – instalační USB musí být FAT32","Vzniká při instalaci OS na GPT disk v UEFI režimu"]})
json.dump(d, open(f,"w"), ensure_ascii=False, indent=0)
print(len(d['q']))
