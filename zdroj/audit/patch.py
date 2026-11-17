import json, sys
base = sys.argv[1]
def load(n): return json.load(open(f"{base}/data/{n:02d}.json"))
def save(n, d): json.dump(d, open(f"{base}/data/{n:02d}.json", "w"), ensure_ascii=False, indent=0)
def fix(n, qtext, new):
    d = load(n)
    for q in d['q']:
        if q[0] == qtext:
            q[:] = [qtext] + new; save(n, d); return
    raise SystemExit("not found: " + qtext)
def add(n, rows):
    d = load(n)
    have = {q[0] for q in d['q']}
    for r in rows:
        assert len(r) == 5 and len(set(r[1:])) == 4
        if r[0] not in have: d['q'].append(r)
    save(n, d)

fix(8, "LRU nahrazuje stránku…", ["Nejméně používanou v minulosti (sleduje čas posledního použití)", "Nejstarší načtenou", "Náhodnou", "S nejnižším čítačem"])
fix(5, "Proč se flash ADC vyrábí jen 4–8 bitů?", ["Kvůli velkému počtu komparátorů (2ⁿ − 1)", "Je pomalý", "Je nepřesný v nule", "Potřebuje integrátor"])
fix(10, "Max. délka segmentu 10Base2?", ["200 m", "500 m", "100 m", "50 m"])
fix(19, "Kdy vznikla ISA?", ["1984 (rozšíření sběrnice IBM PC)", "1996", "2004", "1975"])

add(2, [
 ["Z kolika základních částí se skládá Von Neumannova architektura?", "5 – řadič, ALU, paměť, vstupní a výstupní zařízení", "3 – CPU, RAM, disk", "4 – ALU, cache, sběrnice, I/O", "2 – procesor a paměť"],
 ["Co znamená „nezávislost na problému“ u Von Neumanna?", "Stejný počítač řeší různé úlohy pouhou změnou programu", "Počítač nepotřebuje program", "Každý problém má vlastní hardware", "Program nelze měnit"],
 ["Co je potřeba nastavit v DMA řadiči před přenosem?", "Režim, typ přenosu, zdrojovou a cílovou adresu, délku, synchronizaci a indikaci konce", "Jen frekvenci CPU", "Pouze adresu ISR", "Velikost cache"]])
add(10, [
 ["Co je výchozí brána (default gateway)?", "IP adresa nejbližšího routeru, přes který jdou pakety mimo místní síť", "MAC adresa switche", "Adresa DNS serveru", "Broadcast adresa sítě"],
 ["Typická výchozí brána v domácí síti?", "192.168.0.1 nebo 192.168.1.1", "255.255.255.0", "8.8.8.8", "127.0.0.1"]])
add(12, [
 ["Co dělá signál SIGQUIT?", "Ukončí proces s výpisem jádra (Ctrl+\\)", "Násilně zabije proces bez možnosti zachycení", "Pozastaví proces", "Restartuje terminál"],
 ["Co SSH kromě šifrování zajišťuje?", "Autentizaci, integritu dat a volitelnou kompresi", "Jen přidělení IP adresy", "Překlad doménových jmen", "Nic dalšího"],
 ["Proč UNIX běží od superpočítačů po PC?", "Platformová nezávislost díky napsání v C", "Protože je napsán v assembleru", "Protože má GUI", "Protože je od Microsoftu"]])
add(13, [
 ["O kolik ušetří kódování MFM oproti FM?", "Až 20 %", "Až 50 %", "Nic", "Až 90 %"],
 ["O kolik ušetří RLL oproti MFM?", "Až 50 %", "Až 20 %", "Až 5 %", "Až 100 %"]])
add(15, [
 ["Kolik dat zaadresuje 28bitová LBA (sektor 512 B)?", "≈ 137 GB", "≈ 2 TB", "≈ 8 GB", "≈ 128 PB"],
 ["Kterými nástroji se opravují chyby v registru dle podkladů?", "TuneUp Utilities, Norton Utilities, CCleaner", "DiskEdit, Paragon", "fdisk, format", "ipconfig, ping"],
 ["Jaké atributy může mít položka adresáře FAT?", "Read-only, Hidden, System, Volume label, Subdirectory, Archive", "Owner, Group, Other", "ACL a EFS", "Jen Read-only"]])
add(16, [
 ["Ve které záložce Setupu najdeš XMP profily pamětí?", "Performance / OC / Ai Tweaker", "Boot", "Security", "Exit"],
 ["Co je Chassis Intrusion (záložka Security)?", "Detekce otevření skříně", "Ochrana proti přepětí", "Rychlý start", "Šifrování disku"],
 ["Které funkce má BIOS?", "POST, zavedení OS, komunikace HW–SW, Setup, API pro OS", "Jen formátování disku", "Jen ovládání ventilátorů", "Správu uživatelských účtů"]])
add(17, [
 ["Jaký modul odpovídá DDR-266?", "PC-2100", "PC-1600", "PC-2700", "PC-3200"],
 ["Jaký modul odpovídá DDR-400?", "PC-3200", "PC-2700", "PC-1600", "PC-6400"]])
add(19, [
 ["Typické použití PCIe x8?", "Některé profesionální GPU a AI akcelerátory", "Tunery", "Klávesnice", "Herní GPU výhradně"],
 ["Co je Hot-Plugging u PCIe?", "Připojení/odpojení zařízení za chodu (u některých verzí)", "Přetaktování linky", "Zdvojení lanes", "Chlazení slotu"]])
add(20, [
 ["Kdy vyšlo USB 2.0 a USB 3.0?", "2000 a 2008", "1996 a 2000", "2008 a 2015", "2004 a 2010"],
 ["Kdo zahajuje přenos na sběrnici USB?", "Vždy hostitel (PC) – zařízení jen po vyzvání", "Kterékoli zařízení", "Hub", "Poslední připojené zařízení"]])
print("ok")
