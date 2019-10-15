# Felda
V simulátoru Felície se konečně můžete posadit za ~~volant~~ pedály a řadící páku známého lidového vozítka!
Nejzábavnější fyzikální simulace všech dob je založená _převážně_ na reálných datech a zahrnuje fyzikální model motoru, převodovky a spojky, které můžete ovládat a sledovat tak jízdní vlastnosti včetně spotřeby paliva, a nebo se prostě jen kochat pohledem na ubíhající krajinu!
Nově je zde i mnoho dalších aut!

**[odkaz](http://jira.zby.cz/content/Felda/) na produkční aplikaci**

Jedná se o čistě frontendovou aplikaci napsanou v HTML/CSS/JS za pomoci frameworku [AngularJS](https://angularjs.org/).

## Struktura aplikace

Převážná část HTML je v **index.html**, veškeré statické CSS _(které není inline)_, je v **app/style.css** (dynamické je pak nastaveno v příslušných Angular controllerech)

### Javascript

**app/model.js** definuje objekt `M`, v němž se nachází veškerá funkcionalita související se samotným výpočtem simulace (kromě výstupní konverze jednotek, která patří do controlleru).
Model je spouštěn časovačem z controlleru, avšak pro svůj běh Angular nepotřebuje

**app/misc.js** obsahuje různý nepořádek, co nepatří nikam jinam - obecné globální a prototypové funkce, deklarace, event listenery neposkytované Angularem,
image preloading a objekt `saveService`, který slouží na ukládání/načítání uživatelských dat do Local Storage

**app/controller.js** definuje Angular controller, který obsluhuje vše, co se týká view/controller vrstvy aplikace, avšak kromě canvasu (viz `R`)

**app/directives.js** definuje direktivy, do kterých byla vyčleněna část funkcionality controlleru, jmenovitě:  
`tooltip` nahrazuje HTML title  
`minimap` využívá tooltip pro minimapku  
`gearstick` vykresluje a obsluhuje řadící páku

**app/showroom.js** definuje direktivu `showroom`, která je tak velká, že si zaslouží svůj vlastní soubor

**app/render.js** definuje objekt `R`, který zajišťuje vykreslování canvasu pro herní grafiku, grafy a řadící páku (bez Angularu)

**app/sounds.js** definuje objekt `soundService`, který zajišťuje zvukové efekty

**app/level.js** definuje objekt `L`, který zajišťuje generaci levelů z předpisů a jejich čtení pro účely modelu

**app/data.js** definuje všechna statická data aplikace kromě dat pro jednotlivá auta

**app/cars.js** definuje data pro jednotlivá auta

**app/userdata.js** definuje konstruktory na objekty stavu aplikace a uživatelských dat, což jsou po vytvoření objekty `S` (stav simulace) a `CS` (stav UI)

**app/ng/ \* .html** všechny HTML soubory v tomto adresáři jsou templates pro ng-include nebo pro direktivy
