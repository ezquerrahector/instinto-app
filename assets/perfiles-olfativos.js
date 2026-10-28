/* INSTINTO — Perfiles olfativos SUGERIDOS de las fragancias originales (información pública general).
 * Se usan solo para COMPLETAR campos vacíos del catálogo desde Catálogo → "Completar perfiles olfativos".
 * Nunca sobrescriben lo que ya capturaste. Todo queda editable en cada fragancia.
 * Clave: 'MARCA|NOMBRE' normalizado (sin acentos ni signos). Si el mismo nombre existe en dos líneas,
 * se antepone la línea: 'Dama:VERSACE|EROS'.
 * Valor: [familias (la primera es la principal), salida, corazón, fondo, intensidad 1-3, momento d/n/b]
 */
(function(root){
const P = {
'ARIANA GRANDE|CLOUD':['Dulce, Floral','Lavanda, pera, bergamota','Coco, praliné, vainilla de orquídea','Almizcle, maderas cremosas',2,'b'],
'ARIANA GRANDE|CLOUD PINK':['Dulce, Floral','Pera, mandarina, frambuesa','Peonía, praliné, flor de durazno','Almizcle, vainilla, maderas',2,'d'],
'ARIANA GRANDE|SWEET LIKE CANDY':['Dulce, Floral','Mora, pera, bergamota','Jazmín, malvavisco','Almizcle, vainilla, ámbar',2,'b'],
'ARMANI|AQUA DI GIO':['Fresca, Floral','Limón de Amalfi, pera, peonía','Jazmín, freesia, jacinto','Almizcle blanco, cedro, ámbar',1,'d'],
'ARMANI|AQUA DI GIOIA':['Fresca, Floral','Menta, limón, pera','Jazmín de agua, peonía','Azúcar morena, cedro, labdanum',1,'d'],
'ARMANI|MY WAY':['Floral, Fresca','Bergamota, flor de naranjo','Nardo, jazmín','Vainilla, almizcle blanco, cedro',2,'b'],
'ARMANI|S':['Dulce, Floral','Grosella negra (cassis)','Rosa de mayo, freesia','Vainilla, pachulí, ámbar',2,'b'],
'BILLIE EILISH|EILISH EAU DE PARFUM':['Dulce, Oriental','Mandarina, pera azucarada, frutos rojos','Cacao, especias, rosa','Vainilla, almizcle, maderas cremosas',2,'b'],
'BURBERRY|BURBERRY HER':['Dulce, Floral','Fresa, frambuesa, mora, cereza','Jazmín, violeta','Almizcle, ámbar, vainilla, musgo',2,'d'],
'BVLGARI|OMNIA CRYSTALLINE':['Floral, Fresca','Bambú, pera nashi','Loto, té','Madera de balsa, almizcle',1,'d'],
'CACHAREL|AMOR AMOR':['Floral, Dulce','Grosella negra, naranja, mandarina','Rosa, jazmín, lirio','Vainilla, almizcle, ámbar',2,'b'],
'CALVIN KLEIN|EUPHORIA':['Oriental, Floral','Granada, caqui','Loto, orquídea negra','Ámbar, caoba, violeta, crema',3,'n'],
'CAROLINA HERRERA|212':['Floral, Fresca','Bergamota, mandarina, hojas verdes','Gardenia, camelia, lirio','Almizcle, sándalo, vetiver',1,'d'],
'CAROLINA HERRERA|212 HEROES':['Floral, Dulce','Ruibarbo, pera, grosella','Peonía, jazmín','Almizcle, vainilla, pachulí',2,'d'],
'CAROLINA HERRERA|212 VIP':['Dulce, Oriental','Ron, maracuyá','Gardenia, almizcle','Vainilla, haba tonka',2,'n'],
'CAROLINA HERRERA|CH':['Floral, Dulce','Bergamota, toronja, durazno','Jazmín, rosa, orquídea','Praliné, sándalo, cuero suave',2,'b'],
'CAROLINA HERRERA|GOOD GIRL':['Dulce, Oriental','Almendra, café, bergamota','Nardo, jazmín sambac, rosa','Haba tonka, cacao, vainilla, sándalo',3,'n'],
'CAROLINA HERRERA|GOOD GIRL BLUSH':['Floral, Dulce','Bergamota, pimienta rosa','Peonía, ylang-ylang','Vainilla, haba tonka, almizcle',2,'d'],
'CAROLINA HERRERA|LA BOMBA EDP':['Floral, Dulce','Pitahaya, pimienta rosa','Peonía, flor de cerezo','Vainilla, almizcle',2,'b'],
'CHANEL|CHANCE EAU SPLENDIDE':['Floral, Fresca','Frambuesa, pimienta rosa, membrillo','Rosa, geranio, violeta','Almizcle blanco, cedro, iris',2,'d'],
'CHANEL|CHANCE EAU FRAICHE':['Fresca, Floral','Limón, cedro, pimienta rosa','Jacinto de agua, jazmín','Teca, vetiver, pachulí, almizcle',1,'d'],
'CHANEL|CHANCE EAU TENDRE':['Floral, Fresca','Membrillo, toronja','Jacinto, jazmín','Almizcle, iris, ámbar',1,'d'],
'CHANEL|CHANEL 5':['Floral','Aldehídos, ylang-ylang, neroli, bergamota','Iris, jazmín, rosa de mayo, lirio de los valles','Sándalo, vainilla, vetiver, almizcle',3,'b'],
'CHANEL|COCO MADEMOISSELLE INTENSE':['Oriental, Floral','Bergamota, naranja','Rosa, jazmín','Pachulí, haba tonka, vainilla, almizcle',3,'n'],
'DIOR|HYPNOTIC POISON':['Dulce, Oriental','Coco, ciruela, chabacano','Almendra amarga, jazmín sambac, tuberosa','Vainilla, almizcle, sándalo',3,'n'],
'DIOR|JADORE':['Floral','Pera, melón, magnolia, bergamota','Jazmín, rosa, lirio de los valles, tuberosa','Almizcle, vainilla, cedro',2,'b'],
'DIOR|MISS DIOR EAU DE PARFUM 2021':['Floral','Iris, mandarina','Rosa de Grasse, peonía','Almizcle, vainilla, maderas',2,'d'],
'DOLCE GABBANA|DOLCE':['Floral','Neroli, papaya','Flor de naranjo, amarilis, nenúfar','Almizcle, cachemira, narciso',1,'d'],
'DOLCE GABBANA|LIGHT BLUE':['Fresca','Limón siciliano, manzana, cedro','Jazmín, bambú, rosa blanca','Cedro, ámbar, almizcle',1,'d'],
'DOLCE GABBANA|Q BY DOLCE GABANNA':['Floral, Fresca','Cereza, limón siciliano, mandarina','Jazmín, heliotropo','Cedro, heliotropo',2,'b'],
'DOLCE GABBANA|THE ONE ESSENCE':['Oriental, Dulce','Mandarina, bergamota, durazno','Lirio, jazmín, ciruela','Vainilla, ámbar, almizcle, vetiver',3,'n'],
'DONNA KARAN|BE DELICIOUS':['Fresca, Floral','Manzana verde, pepino, toronja','Tuberosa, violeta, rosa, magnolia','Sándalo, ámbar, maderas blancas',1,'d'],
'DONNA KARAN|BE DELICIOUS FRESH BLOSSOM':['Floral, Fresca','Manzana, grosella negra, toronja','Rosa, jazmín, durazno','Ámbar, almizcle, maderas',1,'d'],
'ELIZABETH ARDEN|5TH AVENUE':['Floral','Lila, tilo, magnolia, bergamota','Rosa, jazmín, durazno, clavo','Ámbar, sándalo, vainilla, almizcle',2,'b'],
'GUCCI|GUCCI GUILTY EDP INTENSE':['Oriental, Floral','Mandarina, pimienta rosa','Lila, geranio, durazno','Pachulí, ámbar, vainilla',3,'n'],
'GUERLAIN|SHALIMAR':['Oriental, Dulce','Bergamota, limón, mandarina','Iris, jazmín, rosa','Vainilla, haba tonka, incienso, opopónaco',3,'n'],
'HUGO BOSS|HUGO WOMAN':['Floral, Fresca','Manzana, piña, mandarina','Jazmín, nenúfar, freesia','Almizcle, sándalo',1,'d'],
'JEAN CHARLES BROSSEAU|OMBRE ROSE':['Floral, Dulce','Durazno, aldehídos, geranio','Rosa, iris, ylang-ylang','Vainilla, almizcle, sándalo, haba tonka',2,'b'],
'JEAN PAUL GAULTIER|GAULTIER DIVINE LE PARFUM':['Floral, Oriental','Mandarina, pera','Lirio, flor de naranjo','Vainilla, sándalo, almizcle',3,'n'],
'JEAN PAUL GAULTIER|SCANDAL':['Dulce, Floral','Naranja sanguina, mandarina','Miel, gardenia, jazmín, flor de naranjo','Cera de abeja, pachulí, caramelo',3,'n'],
'JOVAN|JOVAN MUSK':['Floral, Oriental','Bergamota, limón, aldehídos','Almizcle, rosa, jazmín','Almizcle, ámbar, sándalo',2,'b'],
'KATY PERRY|MEOW':['Dulce, Floral','Pera, mandarina, toronja','Jazmín, chocolate blanco, freesia','Vainilla, almizcle, sándalo',2,'d'],
'KATY PERRY|PURR':['Floral, Fresca','Durazno, manzana verde, bambú','Jazmín, freesia, rosa','Vainilla, almizcle, sándalo',1,'d'],
'KENZO|KENZO AMOUR':['Dulce, Oriental','Arroz, té blanco, flor de cerezo','Heliotropo, frangipani','Vainilla, incienso, almizcle',2,'b'],
'LANCOME|LA VIE EST BELLE':['Dulce','Grosella negra, pera','Iris, jazmín, flor de naranjo','Praliné, vainilla, pachulí, haba tonka',3,'b'],
'LANCOME|LA VIE EST BELLE LELIXIR EDP':['Dulce, Oriental','Frambuesa, pimienta rosa','Iris, rosa','Vainilla, pachulí, haba tonka, ámbar',3,'n'],
'LOUIS VUITTON|ATTRAPES REVES':['Floral, Dulce','Lichi, pera','Peonía, jazmín','Cacao, pachulí, almizcle',2,'b'],
'MARC JACOBS|DAISY EAU SO INTENSE':['Floral','Pera, ciruela, toronja','Jazmín, violeta, flor de naranjo','Almizcle, ámbar, vainilla',2,'d'],
'MONTBLANC|SIGNATURE':['Floral, Dulce','Mandarina, magnolia','Peonía, osmanto','Vainilla, almizcle blanco, benjuí',2,'b'],
'MOSCHINO|CHEAP CHIC I LOVE LOVE':['Fresca, Floral','Naranja, limón, toronja, grosella','Rosa, jazmín, canela','Almizcle, cedro, madera de té',1,'d'],
'MOSCHINO|TOY 2':['Fresca, Floral','Mandarina, manzana, magnolia','Jazmín, peonía, grosella blanca','Almizcle, sándalo, ámbar',1,'d'],
'MUGLER|ANGEL':['Dulce, Oriental','Algodón de azúcar, coco, melón, bergamota','Miel, frutos rojos, chocolate, caramelo','Pachulí, vainilla, haba tonka, almizcle',3,'n'],
'MUGLER|ANGEL NOVA':['Dulce, Floral','Frambuesa, lichi','Rosa damascena','Pachulí, benjuí, maderas',2,'b'],
'NARCISO RODRIGUEZ|PURE MUSK FOR HER':['Floral','Almizcle, flores blancas','Rosa, jazmín','Cachemira, maderas, almizcle',2,'b'],
'NINA RICCI|NINA':['Dulce, Fresca','Manzana roja, lima, limón','Praliné, peonía, datura','Manzano, cedro, almizcle blanco',2,'d'],
'PACO RABANNE|FAME':['Floral, Dulce','Mango, bergamota','Jazmín, incienso','Vainilla, sándalo',2,'b'],
'PACO RABANNE|OLYMPEA':['Dulce, Oriental','Mandarina verde, jazmín de agua, flor de jengibre','Vainilla, sal','Cachemira, sándalo, ámbar gris',2,'b'],
'PARIS HILTON|GOLD RUSH':['Dulce, Floral','Mandarina, frutos rojos','Jazmín, rosa','Vainilla, almizcle, ámbar',2,'b'],
'PERRY ELLIS|360':['Floral, Fresca','Mandarina, bergamota, nenúfar','Jazmín, rosa, lirio','Sándalo, almizcle, ámbar',1,'d'],
'PRADA|PRADA PARADOXE':['Floral, Dulce','Pera, bergamota, mandarina','Neroli, jazmín','Ámbar, vainilla, almizcle',2,'b'],
'SELENA GOMEZ|SELENA GOMEZ EDP':['Dulce, Floral','Frutos rojos, pera','Jazmín, peonía','Vainilla, almizcle',2,'b'],
'TOM FORD|ORCHID SOLEIL':['Floral, Dulce','Pimienta rosa, flor de naranjo','Tuberosa, nardo, orquídea','Cacao, vainilla, pachulí',3,'n'],
'TOUS|GEMS PARTY':['Floral, Dulce','Frutos rojos, mandarina','Rosa, jazmín','Vainilla, almizcle',2,'b'],
'VALENTINO|VALENTINO BORN IN ROMA':['Floral, Dulce','Grosella negra, pimienta rosa, bergamota','Jazmín sambac, té de jazmín','Vainilla bourbon, cachemira, guayaco',2,'b'],
'VALENTINO|VALENTINO BORN IN ROMA INTENSE':['Dulce, Oriental','Vainilla, jazmín','Vainilla bourbon','Vetiver, ámbar',3,'n'],
'VALENTINO|DONNA BORN IN ROMA EXTRADOSE':['Dulce, Oriental','Jazmín, vainilla','Vainilla, especias','Ámbar, maderas',3,'n'],
'VALENTINO|VALENTINO DONNA BORN IN ROMA GREEN':['Fresca, Floral','Bergamota, té verde','Jazmín','Vainilla, maderas',2,'d'],
'VERSACE|BRIGHT CRYSTAL':['Floral, Fresca','Yuzu, granada','Peonía, magnolia, loto','Almizcle, ámbar, caoba',1,'d'],
'VERSACE|DYLAN PURPLE':['Floral, Fresca','Pera, bergamota, mandarina','Freesia, osmanto, durazno','Almizcle, ámbar, maderas',1,'d'],
'Dama:VERSACE|EROS':['Floral, Fresca','Limón siciliano, granada, bergamota','Peonía, jazmín, flor de limón','Sándalo, almizcle, ámbar',2,'b'],
'VIKTOR ROLF|FLOWERBOMB':['Floral, Dulce','Té, bergamota, osmanto','Orquídea, jazmín, rosa, freesia','Pachulí, almizcle, vainilla',3,'n'],
'YVES SAINT LAURENT|BLACK OPIUM':['Dulce, Oriental','Pera, pimienta rosa, flor de naranjo','Café, jazmín, almendra amarga','Vainilla, pachulí, cedro',3,'n'],
'YVES SAINT LAURENT|LIBRE':['Floral, Dulce','Lavanda, mandarina, grosella negra','Flor de naranjo, jazmín','Vainilla de Madagascar, almizcle, cedro',2,'b'],
'YVES SAINT LAURENT|MON PARIS':['Dulce, Floral','Fresa, frambuesa, pera, bergamota','Jazmín, peonía, datura','Pachulí, almizcle blanco, vainilla',2,'b'],
'RALPH LAUREN|RALPH':['Fresca, Floral','Manzana, mandarina, osmanto','Freesia, magnolia, violeta','Almizcle, maderas',1,'d'],
'ARMAF|CLUB DE NUIT OUD PARFUM':['Oriental, Amaderada','Azafrán, especias','Oud, rosa','Ámbar, maderas, almizcle',3,'n'],
'CALVIN KLEIN|CK BE':['Aromática','Lavanda, menta, bergamota','Flor de magnolia, durazno','Almizcle, sándalo, haba tonka',1,'d'],
'CALVIN KLEIN|CK ONE':['Fresca','Limón, bergamota, piña, papaya','Té verde, jazmín, violeta','Almizcle, cedro, ámbar',1,'d'],
'CREED|ORIGINAL VETIVER':['Amaderada, Fresca','Bergamota, mandarina, jengibre','Vetiver, iris','Almizcle, sándalo, ámbar',1,'d'],
'CREED|VIRGIN ISLAND WATER':['Fresca, Dulce','Lima, coco, bergamota','Jengibre, jazmín, ron','Almizcle, caña de azúcar',1,'d'],
'LE LABO|ANOTHER 13':['Amaderada, Floral','Pera, ambrette','Ambroxan, jazmín','Almizcle, musgo',2,'b'],
'LE LABO|SANTAL 33':['Amaderada','Cardamomo, violeta','Iris, papiro','Sándalo, cedro, cuero',2,'b'],
'LE LABO|THE NOIR 29':['Amaderada, Oriental','Higo, bergamota, laurel','Té negro, cedro','Tabaco, heno, vetiver, almizcle',2,'b'],
'LE LABO|THE MATCHA 26':['Amaderada, Aromática','Té matcha','Higo, flores blancas','Cedro, vetiver',1,'d'],
'LOUIS VUITTON|OMBRE NOMADE 2':['Oriental, Amaderada','Frambuesa, incienso','Rosa, geranio','Oud, benjuí, abedul',3,'n'],
'MAISON FRANCIS KURKDJIAN|BACCARAT ROUGE':['Dulce, Amaderada','Azafrán, jazmín','Ámbar gris, ámbar','Resina de abeto, cedro',3,'b'],
'MOSCHINO|TOY 2 PEARL':['Floral, Fresca','Bergamota, mandarina','Flores blancas, rosa','Almizcle, maderas',1,'d'],
'TOM FORD|CHERRY SMOKE':['Dulce, Oriental','Cereza, azafrán','Cuero, osmanto','Maderas ahumadas, cedro',3,'n'],
'TOM FORD|LOST CHERRY':['Dulce','Cereza negra, licor de cereza, almendra amarga','Ciruela, rosa turca, jazmín sambac','Haba tonka, vainilla, sándalo, cedro',3,'n'],
'TOM FORD|OMBRE LEATHER':['Amaderada, Oriental','Cardamomo','Cuero, jazmín sambac','Ámbar, musgo, pachulí',3,'n'],
'TOM FORD|OUD WOOD':['Amaderada, Oriental','Palo de rosa, cardamomo, pimienta','Oud, sándalo, vetiver','Haba tonka, vainilla, ámbar',2,'b'],
'TOM FORD|SOLEIL BLANC':['Fresca, Dulce','Bergamota, cardamomo, pistacho','Ylang-ylang, jazmín, tuberosa','Coco, ámbar, benjuí',2,'d'],
'TOM FORD|TOBACCO VANILLE':['Oriental, Dulce','Hoja de tabaco, especias','Vainilla, cacao, haba tonka, flor de tabaco','Frutos secos, maderas',3,'n'],
'TOM FORD|VANILLE FATALE 2024':['Dulce, Oriental','Azafrán, café','Vainilla','Gamuza, maderas',3,'n'],
'XERJOFF|ERBA PURA':['Dulce, Fresca','Naranja siciliana, limón, bergamota','Frutas mediterráneas','Almizcle blanco, vainilla de Madagascar, ámbar',3,'b'],
'YVES SAINT LAURENT|BABYCAT':['Dulce, Oriental','Azafrán, pimienta','Vainilla, cuero','Ámbar, maderas',3,'n'],
'MONTALE|ARABIANS TONKA':['Oriental, Dulce','Azafrán, bergamota','Rosa búlgara, oud','Haba tonka, ámbar, almizcle',3,'n'],
'ARMANI|ACQUA DI GIO':['Fresca','Lima, limón, bergamota, notas marinas','Jazmín, romero, durazno, fresia','Almizcle blanco, cedro, pachulí',1,'d'],
'ARMANI|ACQUA DI GIO ABSOLU':['Fresca, Amaderada','Bergamota, pera, notas acuáticas','Lavanda, romero, salvia','Pachulí, ládano, maderas',2,'b'],
'ARMANI|ACQUA DI GIO PARFUM':['Fresca, Aromática','Bergamota, notas marinas','Romero, salvia, geranio','Incienso, pachulí',2,'b'],
'ARMANI|AQUA DI GIO PROFONDO':['Fresca, Aromática','Notas marinas, bergamota, mandarina verde','Romero, lavanda, ciprés','Almizcle, pachulí, ámbar mineral',2,'d'],
'ARMANI|ARMANI BLACK CODE':['Oriental, Amaderada','Bergamota, limón','Anís estrellado, flor de olivo','Haba tonka, cuero, tabaco',2,'n'],
'ARMANI|EMPORIO ARMANI WHITE':['Fresca, Aromática','Bergamota, limón, mandarina','Pimienta, cardamomo, nuez moscada','Cedro, ámbar, almizcle',1,'d'],
'AZZARO|CHROME':['Fresca','Limón, bergamota, romero, neroli','Notas acuáticas, jazmín, cilantro','Almizcle, musgo de roble, sándalo',1,'d'],
'BVLGARI|AQVA POUR HOMME':['Fresca, Aromática','Mandarina, petitgrain','Algas marinas, santolina','Ámbar mineral, cedro',1,'d'],
'BVLGARI|MAN IN BLACK':['Oriental, Amaderada','Ron, especias','Cuero, tuberosa, iris','Haba tonka, guayaco, benjuí',3,'n'],
'BVLGARI|MAN WOOD ESSENCE':['Amaderada, Fresca','Bergamota, limón','Ciprés, vetiver','Cedro, benjuí',2,'d'],
'CALVIN KLEIN|EUPHORIA MEN':['Amaderada, Oriental','Pimienta negra, jengibre','Albahaca, salvia','Gamuza, pachulí, ámbar',2,'n'],
'CAROLINA HERRERA|212 MEN':['Aromática, Amaderada','Toronja, limón, hojas verdes','Jengibre, violeta, salvia','Almizcle, sándalo, incienso',1,'d'],
'CAROLINA HERRERA|212 VIP WINS':['Dulce, Oriental','Bergamota, pimienta rosa','Ron, haba tonka','Benjuí, maderas',2,'n'],
'CAROLINA HERRERA|BAD BOY LE PARFUM':['Oriental, Dulce','Pimienta, bergamota','Salvia, cacao','Haba tonka, ámbar, maderas',3,'n'],
'CAROLINA HERRERA|CHIC FOR MEN':['Amaderada, Aromática','Toronja, bergamota','Pimienta, salvia','Sándalo, cedro, almizcle',2,'b'],
'CHANEL|ALLURE HOMME SPORT':['Fresca, Amaderada','Naranja, mandarina, aldehídos','Pimienta, neroli, cedro','Haba tonka, vainilla, almizcle blanco, vetiver',2,'d'],
'CHANEL|BLEU':['Fresca, Amaderada','Toronja, limón, menta, pimienta rosa','Jengibre, nuez moscada, jazmín','Incienso, cedro, sándalo, vetiver',2,'b'],
'CHANEL|EGOISTE PLATINUM':['Aromática, Amaderada','Lavanda, romero, neroli','Geranio, salvia, jazmín','Vetiver, musgo de roble, cedro',2,'d'],
'CREED|AVENTUS':['Fresca, Amaderada','Piña, grosella negra, manzana, bergamota','Abedul, pachulí, jazmín','Almizcle, musgo de roble, ámbar gris, vainilla',2,'b'],
'DIESEL|ONLY THE BRAVE':['Aromática, Amaderada','Limón, mandarina, cilantro','Violeta, cedro','Cuero, benjuí, ládano',2,'b'],
'DIOR|FAHRENHEIT':['Amaderada, Oriental','Nuez moscada, hoja de violeta, mandarina','Cuero, sándalo, madreselva','Vetiver, almizcle, haba tonka',3,'n'],
'DIOR|SAUVAGE':['Fresca, Aromática','Bergamota de Calabria, pimienta','Pimienta de Sichuan, lavanda, geranio','Ambroxan, cedro, ládano',2,'b'],
'DIOR|SAUVAGE ELIXIR':['Oriental, Aromática','Canela, nuez moscada, cardamomo, toronja','Lavanda','Regaliz, sándalo, ámbar, pachulí',3,'n'],
'DOLCE GABBANA|K BY DOLCE':['Aromática, Amaderada','Naranja sanguina, enebro, limón','Salvia, pimiento, lavanda','Vetiver, cedro, pachulí',2,'b'],
'GIVENCHY|BLUE LABEL':['Fresca, Aromática','Toronja, bergamota, cardamomo','Geranio, canela','Vetiver, haba tonka, ámbar',1,'d'],
'GIVENCHY|GENTLEMAN':['Oriental, Amaderada','Pimienta negra, cardamomo','Iris, lavanda','Pachulí, vainilla negra, haba tonka',2,'n'],
'GUCCI|GUILTY ELIXIR DE PARFUM POUR HOMME':['Oriental, Amaderada','Pimienta rosa, limón','Flor de naranjo, lavanda','Pachulí, cedro, vainilla',3,'n'],
'HERMES|TERRES DHERMES':['Amaderada, Fresca','Naranja, toronja','Pimienta, pelargonio, sílex','Vetiver, cedro, pachulí, benjuí',2,'d'],
'JEAN PAUL GAULTIER|LE MALE':['Aromática, Dulce','Lavanda, menta, cardamomo, bergamota','Canela, flor de naranjo, comino','Vainilla, haba tonka, sándalo, ámbar',2,'n'],
'JEAN PAUL GAULTIER|LE MALE ELIXIR ABSOLU':['Dulce, Oriental','Lavanda, especias','Miel, tabaco','Haba tonka, vainilla, maderas',3,'n'],
'Caballero:JEAN PAUL GAULTIER|SCANDAL':['Dulce, Aromática','Mandarina, salvia','Caramelo, nardo','Haba tonka, vetiver',3,'n'],
'LACOSTE|1212 BLANC':['Fresca','Toronja, cardamomo, romero','Tuberosa, ylang-ylang','Cedro, cuero, vetiver, almizcle',1,'d'],
'LOUIS VUITTON|LIMMENSITE':['Fresca, Amaderada','Toronja, bergamota, jengibre','Notas acuáticas, salvia, romero','Ámbar, ládano',2,'d'],
'LOUIS VUITTON|IMAGINATION':['Fresca, Amaderada','Cidra, bergamota, naranja de Calabria','Té negro, jengibre, canela','Ambroxan, guayaco, incienso',2,'d'],
'MONTBLANC|EXPLORER':['Amaderada','Bergamota, pimienta rosa, salvia','Vetiver, cuero','Pachulí, cacao, ambroxan',2,'b'],
'MONTBLANC|LEGEND INTENSE':['Aromática, Amaderada','Bergamota, lavanda, piña','Manzana, salvia, geranio','Haba tonka, sándalo, almizcle',2,'b'],
'MONTBLANC|STARWALKER':['Fresca, Amaderada','Mandarina, bambú, cardamomo','Trigo, nuez moscada','Sándalo, almizcle, ámbar',1,'d'],
'MOSCHINO|TOY BOY':['Oriental, Amaderada','Pimienta rosa, pera, bergamota','Rosa, clavo, nuez moscada','Cachemira, vetiver, ámbar',2,'n'],
'NAUTICA|NAUTICA VOYAGE':['Fresca','Manzana verde, hojas verdes','Loto, mimosa','Almizcle, cedro, ámbar, musgo',1,'d'],
'PACO RABANNE|INVICTUS':['Fresca, Dulce','Toronja, notas marinas, mandarina','Laurel, jazmín','Ámbar gris, guayaco, musgo, pachulí',2,'d'],
'PACO RABANNE|ONE MILLION':['Oriental, Dulce','Toronja, menta, mandarina sanguina','Canela, rosa, especias','Cuero, ámbar, maderas, pachulí',3,'n'],
'PALOMA PICASSO|MINOTAURO':['Oriental, Amaderada','Bergamota, mandarina, lavanda','Rosa, jazmín, vetiver','Ámbar, vainilla, sándalo, musgo',3,'n'],
'PRADA|LUNA ROSSA CARBON':['Aromática, Fresca','Bergamota, pimienta','Lavanda, notas metálicas','Ambroxan, pachulí',2,'d'],
'RALPH LAUREN|POLO 67':['Aromática, Amaderada','Bergamota, pimienta','Lavanda, salvia','Vetiver, maderas',2,'d'],
'SALVATORE FERRAGAMO|FERRAGAMO':['Amaderada, Aromática','Bergamota, pimienta rosa','Lavanda, cardamomo','Cedro, vetiver, haba tonka',2,'b'],
'VALENTINO|VALENTINO UOMO':['Dulce, Amaderada','Bergamota, mirto','Gianduja (chocolate con avellana), café tostado','Cuero, cedro',2,'n'],
'VALENTINO|VALENTINO UOMO BORN IN ROMA':['Dulce, Aromática','Sal mineral, salvia, violeta','Jengibre, vetiver','Vainilla, maderas',2,'b'],
'VALENTINO|VALENTINO UOMO BORN IN ROMA INTENSE':['Dulce, Oriental','Lavanda','Vainilla','Vetiver',3,'n'],
'VERSACE|EROS':['Dulce, Aromática','Menta, manzana verde, limón','Haba tonka, ambroxan, geranio','Vainilla, vetiver, cedro, musgo',3,'n'],
'VERSACE|EROS FLAME':['Oriental, Amaderada','Mandarina, pimienta negra, limón','Rosa, pimienta','Haba tonka, vainilla, sándalo, cedro',3,'n'],
'VERSACE|VERSACE MAN EAU FRAICHE':['Fresca','Limón, bergamota, carambola','Romero, cedro, estragón','Almizcle, ámbar, sándalo',1,'d'],
'VIKTOR ROLF|SPICEBOMB DARK LEARHER':['Oriental, Amaderada','Pimienta, especias','Cuero, abedul','Tabaco, vetiver',3,'n'],
'YVES SAINT LAURENT|LA NUIT DE LHOMME BLEU ELECTRIQUE':['Oriental, Aromática','Cardamomo, bergamota','Lavanda, cedro','Vetiver, haba tonka',2,'n'],
'YVES SAINT LAURENT|MYSLF LE PARFUM':['Floral, Amaderada','Bergamota de Calabria','Flor de naranjo','Pachulí, maderas ambaradas, vainilla',2,'b'],
'YVES SAINT LAURENT|Y':['Fresca, Aromática','Manzana, jengibre, bergamota','Salvia, enebro, geranio','Haba tonka, cedro, vetiver, incienso',2,'b'],
'YVES SAINT LAURENT|Y EDP INTENSE':['Aromática, Amaderada','Jengibre, bergamota','Lavanda, salvia, geranio','Cedro, haba tonka, vetiver',3,'n'],
'ARMAF|ODYSSEY MANDARIN SKY':['Fresca, Dulce','Mandarina, naranja','Caramelo, especias','Haba tonka, ámbar, maderas',2,'b'],
'ARMAF|CLUB DE NUIT INTENSE MAN':['Fresca, Amaderada','Limón, piña, bergamota, grosella negra','Abedul, jazmín, rosa','Almizcle, ámbar gris, pachulí, vainilla',3,'b']
};
// Segunda tanda (catálogo completo del proveedor). Un 7º valor 1 = APROXIMADO: solo familia,
// intensidad y momento estimados por la línea de la fragancia, sin notas; conviene revisarlos.
const P2 = {
"Dama:ABERCROMBIE & FITCH|AUTHENTIC WOMAN": [
"Floral, Fresca",
"Mandarina, frambuesa, pera",
"Jazmín, gardenia, lirio",
"Almizcle, sándalo, vainilla",
2,
"d"
],
"Dama:ADOLFO DOMINGUEZ|AGUA FRESCA DE GARDENIA MUSK": [
"Floral",
"Bergamota, mandarina",
"Gardenia, jazmín",
"Almizcle blanco",
1,
"d"
],
"Dama:ADOLFO DOMINGUEZ|AGUA FRESCA DE ROSAS BLANCAS": [
"Floral, Fresca",
"Limón, bergamota",
"Rosa blanca, peonía",
"Almizcle, cedro",
1,
"d"
],
"Dama:ADOLFO DOMINGUEZ|NUDE MUSK EDP": [
"Floral",
"Bergamota, pera",
"Iris, rosa, flor de naranjo",
"Almizcle, maderas cremosas",
1,
"b"
],
"Dama:ADOLFO DOMINGUEZ|TERRACOTA MUSK": [
"Floral, Amaderada",
"Mandarina, pimienta rosa",
"Rosa, jazmín",
"Almizcle, pachulí, maderas",
1,
"b"
],
"Dama:AGATHA RUIZ DE LA PRADA|FLOREVER": [
"Floral, Dulce",
"Frambuesa, mandarina",
"Jazmín, rosa, peonía",
"Vainilla, almizcle",
1,
"d"
],
"Dama:AGATHA RUIZ DE LA PRADA|LOOK": [
"Floral, Fresca",
"Bergamota, limón, manzana",
"Jazmín, rosa, lirio",
"Almizcle, cedro",
1,
"d"
],
"Dama:AGATHA RUIZ DE LA PRADA|LOOK KOOL": [
"Fresca, Floral",
"Toronja, mandarina, notas verdes",
"Jazmín, peonía",
"Almizcle, maderas",
1,
"d"
],
"Dama:AGATHA RUIZ DE LA PRADA|WOW GIRL!": [
"Dulce, Floral",
"Frambuesa, pera, mandarina",
"Flor de naranjo, jazmín",
"Vainilla, caramelo, almizcle",
2,
"b"
],
"Dama:ALFRED DUNHILL|DESIRE WOMAN": [
"Floral, Fresca",
"Bergamota, limón",
"Rosa, jazmín, lirio",
"Almizcle, sándalo",
1,
"d"
],
"Dama:ANIMALE|ANIMALE": [
"Floral, Oriental",
"Bergamota, aldehídos",
"Rosa, jazmín, ylang-ylang",
"Ámbar, almizcle, sándalo",
2,
"n"
],
"Dama:ANIMALE|ANIMALE SEDUCTION": [
"Oriental, Floral",
"Durazno, bergamota",
"Jazmín, nardo",
"Vainilla, almizcle, ámbar",
2,
"n"
],
"Dama:ANNA SUI|FANTASIA": [
"Dulce, Floral",
"Fresa, piña, toronja",
"Fruta del dragón, coco",
"Vainilla, almizcle, maderas",
2,
"d"
],
"Dama:ANTONIO BANDERAS|HER SECRET TEMPTATION": [
"Dulce, Floral",
"Mandarina, frutos rojos",
"Jazmín, rosa",
"Vainilla, ámbar, almizcle",
2,
"b"
],
"Dama:AQUOLINA|PINK SUGAR": [
"Dulce",
"Naranja, bergamota, frambuesa, fresa",
"Algodón de azúcar, regaliz, vainilla",
"Caramelo, almizcle, sándalo",
3,
"b"
],
"Dama:ARIANA GRANDE|ARI": [
"Dulce, Floral",
"Pera, frambuesa, toronja",
"Rosa, peonía, muguete",
"Malvavisco, almizcle, maderas",
2,
"b"
],
"Dama:ARIANA GRANDE|GOD IS WOMAN": [
"Floral, Dulce",
"Lavanda, toronja, pera",
"Rosa, gardenia",
"Vainilla, almizcle, maderas",
2,
"b"
],
"Dama:ARIANA GRANDE|MOD BLUSH": [
"Dulce, Floral",
"Pera, bergamota",
"Frambuesa, jazmín",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:ARIANA GRANDE|MOD VANILLA": [
"Dulce",
"Bergamota, pera",
"Vainilla, praliné",
"Almizcle, sándalo",
2,
"b",
1
],
"Dama:ARIANA GRANDE|MOONLIGHT": [
"Floral, Dulce",
"Ciruela, cereza",
"Peonía, orquídea",
"Almizcle, vainilla, maderas",
2,
"n",
1
],
"Dama:ARIANA GRANDE|R.E.M": [
"Dulce, Oriental",
"Lavanda, pera, sal",
"Malvavisco, rosa",
"Vainilla, almizcle, maderas",
2,
"n"
],
"Dama:ARIANA GRANDE|THANK U NEXT": [
"Dulce, Floral",
"Pera, frambuesa, frutos rojos",
"Coco, rosa",
"Malvavisco, almizcle, maderas",
2,
"b",
1
],
"Dama:ARMANI|AIR DI GIOIA": [
"Fresca, Floral",
"Pera, grosella negra",
"Jazmín, rosa",
"Almizcle, cedro",
1,
"d"
],
"Dama:ARMANI|ARMANI CODE ULTIMATE": [
"Oriental, Floral",
"Frambuesa, pimienta rosa",
"Flor de naranjo, jazmín",
"Vainilla, pachulí, sándalo",
3,
"n"
],
"Dama:ARMANI|BECAUSE IT�S YOU": [
"Floral, Dulce",
"Frambuesa, limón, rosa",
"Rosa, peonía",
"Vainilla, almizcle, cedro",
2,
"b"
],
"Dama:ARMANI|DIAMONDS": [
"Floral, Oriental",
"Frambuesa, rosa, lichi",
"Rosa, fresia, muguete",
"Vainilla, ámbar, almizcle",
2,
"b"
],
"Dama:ARMANI|EMPORIO ARMANI": [
"Floral",
"Fresia, frambuesa",
"Rosa, jazmín",
"Almizcle, sándalo",
1,
"d"
],
"Dama:ARMANI|MY WAY EDP INTENSE": [
"Floral, Dulce",
"Bergamota, flor de naranjo",
"Nardo, jazmín",
"Vainilla, almizcle, cedro",
3,
"b"
],
"Dama:ARMANI|MY WAY NECTAR": [
"Floral, Dulce",
"Bergamota, mandarina",
"Nardo, jazmín, flor de naranjo",
"Vainilla, cachemira",
2,
"b"
],
"Dama:ARMANI|MY WAY PARFUM": [
"Floral, Oriental",
"Bergamota",
"Flor de naranjo, nardo",
"Vainilla, pachulí",
3,
"n"
],
"Dama:ARMANI|S� PASSIONE": [
"Dulce, Oriental",
"Grosella negra, pera, manzana",
"Rosa, jazmín, heliotropo",
"Vainilla, café, maderas",
3,
"n"
],
"Dama:ARMANI|SUN DI GIOIA": [
"Fresca, Floral",
"Bergamota, pera, notas marinas",
"Jazmín, flor de sal",
"Almizcle, ámbar",
1,
"d"
],
"Dama:AVON|FAR AWAY": [
"Floral, Oriental",
"Durazno, frutas tropicales",
"Jazmín, rosa, gardenia",
"Vainilla, sándalo, almizcle",
2,
"n"
],
"Dama:AZZARO|WANTED GIRL": [
"Dulce, Oriental",
"Pimienta rosa, flor de naranjo",
"Haba tonka, rosa",
"Vainilla, pachulí, caramelo",
3,
"n"
],
"Dama:BALENCIAGA|RUMBA": [
"Oriental, Dulce",
"Ciruela, durazno, bergamota",
"Rosa, jazmín, heliotropo",
"Vainilla, ámbar, sándalo",
3,
"n"
],
"Dama:BATH & BODY WORK|DARK KISS": [
"Dulce, Floral",
"Cereza negra, frambuesa",
"Jazmín, rosa",
"Vainilla, almizcle, maderas",
2,
"n",
1
],
"Dama:BATH & BODY WORK|DAT THE BEACH": [
"Fresca, Dulce",
"Notas marinas, cítricos",
"Coco, flores blancas",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BEBE|SHEER": [
"Floral, Fresca",
"Pera, mandarina",
"Jazmín, peonía",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BENETTON|COLORS WOMAN ROSE": [
"Floral",
"Frambuesa, bergamota",
"Rosa, peonía",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BENETTON|SISTERLAND BLUE NEROLI": [
"Fresca, Floral",
"Bergamota, limón",
"Neroli, flor de naranjo",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BENETTON|SISTERLAND GREEN JASMINE": [
"Floral, Fresca",
"Notas verdes, cítricos",
"Jazmín",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BENETTON|SISTERLAND PINK RASPBERRY": [
"Dulce, Floral",
"Frambuesa, frutos rojos",
"Peonía, rosa",
"Almizcle, vainilla",
1,
"d",
1
],
"Dama:BENETTON|SISTERLAND RED ROSE": [
"Floral",
"Pimienta rosa, mandarina",
"Rosa roja",
"Almizcle, pachulí",
1,
"b",
1
],
"Dama:BENETTON|TRIBU": [
"Oriental, Floral",
"Frutas, especias",
"Rosa, jazmín, muguete",
"Vainilla, sándalo, almizcle",
2,
"b",
1
],
"Dama:BENETTON|UNITED DREAM TOGETHER": [
"Floral, Dulce",
"Frambuesa, pera",
"Peonía, jazmín",
"Vainilla, almizcle",
1,
"d",
1
],
"Dama:BENETTON|UNITED DREAMS GREEN CACTUS FOR HER": [
"Fresca, Floral",
"Cactus, notas verdes, bergamota",
"Jazmín, flores blancas",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BEYONCE|CE NOIR": [
"Floral, Oriental",
"Mandarina, pimienta",
"Rosa, jazmín",
"Ámbar, vainilla, almizcle",
2,
"n",
1
],
"Dama:BOND NO 9|NOLITA": [
"Floral, Dulce",
"Bergamota, durazno",
"Rosa, violeta, peonía",
"Almizcle, vainilla, ámbar",
2,
"b"
],
"Dama:BOUCHERON|BOUCHERON": [
"Floral, Oriental",
"Mandarina, cilantro",
"Jazmín, rosa, ylang-ylang",
"Vainilla, ámbar, sándalo",
3,
"n"
],
"Dama:BRITNEY SPEARS|FANTASY": [
"Dulce, Floral",
"Lichi, kiwi, membrillo",
"Orquídea, jazmín, cupcake",
"Almizcle, vainilla, chocolate blanco",
2,
"b"
],
"Dama:BRITNEY SPEARS|FANTASY CIRCUS": [
"Dulce",
"Frambuesa, pera",
"Chocolate, rosa",
"Almizcle, vainilla",
2,
"b"
],
"Dama:BRITNEY SPEARS|FANTASY IN BLOOM": [
"Floral, Dulce",
"Pera, frambuesa",
"Jazmín, peonía",
"Vainilla, almizcle",
2,
"d",
1
],
"Dama:BRITNEY SPEARS|FANTASY INTIMATE EDITION": [
"Dulce, Floral",
"Frutos rojos, pera",
"Orquídea, jazmín",
"Vainilla, almizcle",
2,
"n",
1
],
"Dama:BRITNEY SPEARS|FANTASY ISLAND": [
"Dulce, Floral",
"Coco, piña, mango",
"Flor de cerezo, jazmín",
"Vainilla, almizcle",
2,
"d",
1
],
"Dama:BRITNEY SPEARS|FANTASY JUNGLE": [
"Dulce, Floral",
"Frutos rojos, kiwi",
"Orquídea, jazmín",
"Vainilla, ámbar",
2,
"b",
1
],
"Dama:BRITNEY SPEARS|FANTASY MIDNIGHT": [
"Oriental, Dulce",
"Frutos rojos, mandarina",
"Orquídea, jazmín",
"Vainilla, ámbar, almizcle",
3,
"n",
1
],
"Dama:BRITNEY SPEARS|FANTASY THE NICE REMIX": [
"Dulce, Floral",
"Frutos rojos, pera",
"Orquídea, jazmín",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:BRITNEY SPEARS|ROCKER FEMME FANTASY": [
"Oriental, Dulce",
"Frutos rojos",
"Flores blancas",
"Vainilla, ámbar, cuero",
2,
"n",
1
],
"Dama:BRITNEY SPEARS|SUNSET FANTASY": [
"Floral, Dulce",
"Mandarina, frutas",
"Jazmín, flores tropicales",
"Vainilla, almizcle",
2,
"d",
1
],
"Dama:BURBERRY|BRIT BRUTBERRYS": [
"Floral, Dulce",
"Frutos rojos, cítricos",
"Peonía, rosa",
"Almizcle, vainilla",
1,
"d",
1
],
"Dama:BURBERRY|BURBERRY BODY": [
"Floral, Dulce",
"Absenta, durazno, mandarina",
"Rosa, freesia",
"Cachemira, sándalo, vainilla, ámbar",
2,
"b"
],
"Dama:BURBERRY|BURBERRY FOR WOMAN": [
"Floral, Dulce",
"Durazno, chabacano, grosella",
"Jazmín, sándalo",
"Vainilla, almizcle",
2,
"b"
],
"Dama:BURBERRY|BURBERRY HER ELIXIR DE PARFUM": [
"Dulce, Oriental",
"Fresa, frutos rojos",
"Jazmín, violeta",
"Vainilla, ámbar, haba tonka",
3,
"n"
],
"Dama:BURBERRY|BURBERRY LONDON": [
"Floral",
"Mandarina, grosella",
"Gardenia, jazmín, peonía",
"Pachulí, almizcle",
2,
"b"
],
"Dama:BURBERRY|BURBERRY SPORT WOMAN": [
"Fresca, Floral",
"Toronja, jengibre, limón",
"Flores, melón",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BURBERRY|GODDESS": [
"Dulce, Aromática",
"Lavanda, jengibre",
"Lavanda",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:BVLGARI|AQUA DIVINA": [
"Fresca, Floral",
"Mandarina, notas marinas",
"Jazmín, notas marinas",
"Almizcle, ámbar",
1,
"d",
1
],
"Dama:BVLGARI|CHILL & SOLE": [
"Fresca",
"Cítricos, notas marinas",
"Flores blancas",
"Almizcle",
1,
"d",
1
],
"Dama:BVLGARI|FEMME": [
"Floral, Oriental",
"Rosa, especias",
"Rosa, iris",
"Ámbar, almizcle, maderas",
2,
"n",
1
],
"Dama:BVLGARI|OMNIA BY MARY KATRANTZOU": [
"Floral, Dulce",
"Frutos rojos, mandarina",
"Rosa, peonía",
"Almizcle, vainilla",
1,
"d",
1
],
"Dama:BVLGARI|OMNIA CORAL": [
"Floral, Fresca",
"Granada, mandarina, notas verdes",
"Loto, hibisco",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:BY KILIAN|CAN�T STOP LOVING YOU": [
"Floral, Dulce",
"Rosa, bergamota",
"Rosa, malvavisco",
"Vainilla, almizcle",
2,
"b"
],
"Dama:BY KILIAN|LOVE BY KILIAN": [
"Floral, Dulce",
"Flor de naranjo, bergamota",
"Jazmín, rosa",
"Vainilla, almizcle, ámbar",
2,
"b"
],
"Dama:BY MALUMA|JADE ROYALTY": [
"Floral, Dulce",
"Frutas tropicales, bergamota",
"Jazmín, rosa",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CACHAREL|AMOR AMOR MON PARFUM DU SOIR": [
"Dulce, Oriental",
"Grosella negra, naranja",
"Rosa, jazmín",
"Vainilla, ámbar, almizcle",
2,
"n"
],
"Dama:CACHAREL|ANAIS ANAIS": [
"Floral",
"Grosella, jacinto, limón",
"Lirio, jazmín, rosa, madreselva",
"Almizcle, sándalo, ámbar",
1,
"d"
],
"Dama:CACHAREL|EDEN": [
"Floral, Fresca",
"Melón, mandarina, hojas verdes",
"Loto, jazmín",
"Almizcle, sándalo",
1,
"d"
],
"Dama:CACHAREL|SCARLETT": [
"Floral, Dulce",
"Frambuesa, mandarina",
"Peonía, rosa",
"Vainilla, almizcle",
1,
"d",
1
],
"Dama:CACHAREL|YES I AM": [
"Dulce, Floral",
"Frambuesa, mandarina",
"Jazmín, flor de jengibre",
"Vainilla, cachemira",
2,
"b"
],
"Dama:CACHAREL|YES I AM BLOOM UP!": [
"Floral, Dulce",
"Frambuesa, lichi",
"Jazmín, rosa",
"Vainilla, almizcle",
1,
"d",
1
],
"Dama:CALVIN KLEIN|CALVIN KLEIN": [
"Floral",
"Aldehídos, bergamota",
"Rosa, jazmín, iris",
"Ámbar, almizcle, sándalo",
2,
"b"
],
"Dama:CALVIN KLEIN|CK IN2U WOMAN": [
"Fresca, Floral",
"Bergamota, mandarina",
"Té verde, flor de loto",
"Almizcle, ámbar",
1,
"d"
],
"Dama:CALVIN KLEIN|CK ONE RED EDITION FOR HER": [
"Floral, Dulce",
"Frutos rojos",
"Rosa, jazmín",
"Vainilla, almizcle",
1,
"d",
1
],
"Dama:CALVIN KLEIN|CK ONE SHOCK FOR HER": [
"Dulce, Floral",
"Pepino, mandarina",
"Pimienta, rosa",
"Vainilla, almizcle, pachulí",
2,
"n"
],
"Dama:CALVIN KLEIN|ESCAPE": [
"Fresca, Floral",
"Mandarina, manzana, durazno",
"Jazmín, rosa, clavel",
"Almizcle, sándalo",
1,
"d"
],
"Dama:CALVIN KLEIN|ETERNITY": [
"Floral",
"Mandarina, fresia",
"Lirio, rosa, violeta",
"Almizcle, sándalo, pachulí",
2,
"b"
],
"Dama:CALVIN KLEIN|ETERNITY EAU DE PARFUM INTENSE": [
"Floral",
"Mandarina, bergamota",
"Lirio, rosa",
"Almizcle, sándalo",
2,
"b"
],
"Dama:CALVIN KLEIN|ETERNITY NOW": [
"Floral, Fresca",
"Lichi, ruibarbo",
"Peonía, rosa",
"Almizcle, maderas",
1,
"d"
],
"Dama:CALVIN KLEIN|OBSESSED FOR WOMEN": [
"Floral, Dulce",
"Bergamota, mandarina",
"Rosa, almizcle",
"Vainilla, sándalo",
2,
"b"
],
"Dama:CAROLINA HERRERA|212 GLAM": [
"Floral, Dulce",
"Mandarina, frutos rojos",
"Rosa, jazmín",
"Almizcle, vainilla",
2,
"n",
1
],
"Dama:CAROLINA HERRERA|212 H2O": [
"Fresca, Floral",
"Cítricos, notas acuáticas",
"Flores blancas",
"Almizcle",
1,
"d",
1
],
"Dama:CAROLINA HERRERA|212 ON ICE": [
"Fresca, Floral",
"Cítricos, notas frías",
"Flores blancas",
"Almizcle",
1,
"d",
1
],
"Dama:CAROLINA HERRERA|212 SEXY": [
"Oriental, Dulce",
"Mandarina, pimienta rosa",
"Gardenia, rosa",
"Vainilla, ámbar, sándalo",
2,
"n"
],
"Dama:CAROLINA HERRERA|212 VIP ROS�": [
"Floral, Dulce",
"Champaña rosada, pimienta rosa",
"Rosa, peonía",
"Almizcle, ámbar",
2,
"n"
],
"Dama:CAROLINA HERRERA|212 VIP ROSE I LOVE NY": [
"Floral, Dulce",
"Champaña rosada, frutos rojos",
"Rosa",
"Almizcle, ámbar",
2,
"n",
1
],
"Dama:CAROLINA HERRERA|212 VIP ROS� RED": [
"Floral, Oriental",
"Frutos rojos, champaña",
"Rosa roja",
"Almizcle, ámbar, maderas",
2,
"n",
1
],
"Dama:CAROLINA HERRERA|212 VIP WILD PARTY": [
"Dulce, Floral",
"Frutas, champaña",
"Flores blancas",
"Vainilla, almizcle",
2,
"n",
1
],
"Dama:CAROLINA HERRERA|ALEGRIA DE VIVIR": [
"Floral, Dulce",
"Mandarina, frambuesa",
"Rosa, jazmín",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|CALL ME DARLING": [
"Floral, Dulce",
"Bergamota, frambuesa",
"Rosa, jazmín",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|CAROLINA 2003": [
"Floral, Oriental",
"Bergamota, mandarina",
"Nardo, jazmín",
"Ámbar, almizcle",
2,
"b"
],
"Dama:CAROLINA HERRERA|CAROLINA HERRERA": [
"Floral, Oriental",
"Bergamota, durazno",
"Jazmín, nardo",
"Sándalo, almizcle, ámbar",
3,
"b"
],
"Dama:CAROLINA HERRERA|CH AFRICA LIMITED EDITION": [
"Floral, Dulce",
"Frutas tropicales",
"Flores blancas",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|CH BEAUTY": [
"Floral, Dulce",
"Bergamota, cítricos",
"Rosa, jazmín",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|CH CENTRAL PARK": [
"Floral, Fresca",
"Bergamota, frutas",
"Jazmín, rosa",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:CAROLINA HERRERA|CH EAU DE PARFUM SUBLIME": [
"Floral, Dulce",
"Bergamota, frambuesa",
"Rosa, jazmín",
"Vainilla, pachulí, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|CH HOT! HOT! HOT!": [
"Floral, Oriental",
"Pimienta rosa, naranja",
"Rosa, jazmín",
"Ámbar, vainilla",
2,
"n",
1
],
"Dama:CAROLINA HERRERA|CH INSIGNIA": [
"Floral, Oriental",
"Bergamota",
"Rosa, jazmín",
"Ámbar, cuero suave, almizcle",
2,
"n",
1
],
"Dama:CAROLINA HERRERA|CH L'EAU": [
"Fresca, Floral",
"Bergamota, toronja, mandarina",
"Jazmín, rosa",
"Almizcle, maderas",
1,
"d"
],
"Dama:CAROLINA HERRERA|CH PASSION FOR HER": [
"Floral, Oriental",
"Frutos rojos, bergamota",
"Rosa, jazmín",
"Vainilla, ámbar, almizcle",
2,
"n",
1
],
"Dama:CAROLINA HERRERA|CH QUEEN": [
"Oriental, Floral",
"Bergamota, frutos rojos",
"Rosa, jazmín",
"Pachulí, ámbar, vainilla",
3,
"n",
1
],
"Dama:CAROLINA HERRERA|CHIC": [
"Floral, Dulce",
"Melón, mandarina",
"Flores blancas",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|FEARLESS AND FABULOUS": [
"Floral, Dulce",
"Frutas, cítricos",
"Flores blancas",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|GOOD GIRL BLUSH ELIXIR EDP": [
"Dulce, Oriental",
"Pimienta rosa, bergamota",
"Peonía, ylang-ylang",
"Vainilla, haba tonka, ámbar",
3,
"n"
],
"Dama:CAROLINA HERRERA|GOOD GIRL DAZZLING GARDEN": [
"Floral, Dulce",
"Cítricos, frutas",
"Nardo, jazmín",
"Haba tonka, cacao",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|GOOD GIRL LEGERE": [
"Floral, Dulce",
"Bergamota",
"Nardo, jazmín",
"Haba tonka, almizcle",
2,
"d",
1
],
"Dama:CAROLINA HERRERA|GOOD GIRL MIDNIGHT": [
"Dulce, Oriental",
"Café, almendra",
"Nardo, jazmín",
"Haba tonka, cacao, vainilla",
3,
"n"
],
"Dama:CAROLINA HERRERA|GOOD GIRL SUPERSTAR 2021": [
"Dulce, Oriental",
"Almendra, café",
"Nardo, jazmín",
"Haba tonka, cacao",
3,
"n"
],
"Dama:CAROLINA HERRERA|GOOD GIRL SUPREME": [
"Dulce, Oriental",
"Almendra, bergamota",
"Nardo, jazmín",
"Haba tonka, cacao, vainilla",
3,
"n"
],
"Dama:CAROLINA HERRERA|GOOD GIRL VELVET": [
"Dulce, Oriental",
"Dátil, almendra",
"Nardo, jazmín",
"Haba tonka, cacao, vainilla",
3,
"n"
],
"Dama:CAROLINA HERRERA|LUCKY CHARM": [
"Floral, Dulce",
"Frutas, bergamota",
"Flores blancas",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|MAD WORLD": [
"Floral, Dulce",
"Cítricos, frutas",
"Flores",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|ME FIRST": [
"Floral, Dulce",
"Frutas",
"Flores blancas",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CAROLINA HERRERA|VERY GOOD GIRL": [
"Dulce, Floral",
"Grosella roja, lichi",
"Rosa",
"Vainilla, vetiver",
3,
"n"
],
"Dama:CAROLINA HERRERA|VERY GOOD GIRL GLAM": [
"Dulce, Floral",
"Grosella roja, frambuesa",
"Rosa, peonía",
"Vainilla, almizcle",
3,
"n"
],
"Dama:CARTIER|EAU DE CARTIER": [
"Fresca, Aromática",
"Cítricos, lavanda",
"Violeta, salvia",
"Almizcle, ámbar, maderas",
1,
"d"
],
"Dama:CHANEL|ALLURE": [
"Floral, Oriental",
"Mandarina, bergamota, durazno",
"Jazmín, rosa, magnolia",
"Vainilla, vetiver, almizcle",
2,
"b"
],
"Dama:CHANEL|CHANCE EAU VIVE": [
"Fresca, Floral",
"Toronja, naranja sanguina",
"Jazmín, jacinto",
"Almizcle blanco, cedro, iris",
1,
"d"
],
"Dama:CHANEL|CHANEL 19": [
"Floral, Aromática",
"Gálbano, notas verdes, bergamota",
"Iris, rosa, jazmín",
"Vetiver, cuero, sándalo",
2,
"d"
],
"Dama:CHANEL|COCO CHANEL": [
"Oriental",
"Mandarina, cilantro, durazno",
"Clavo, rosa, jazmín",
"Ámbar, vainilla, opopónaco",
3,
"n"
],
"Dama:CHANEL|COCO MADEMOISSELLE": [
"Oriental, Floral",
"Naranja, bergamota",
"Rosa, jazmín, lichi",
"Pachulí, vetiver, vainilla, almizcle",
3,
"n"
],
"Dama:CHANEL|COCO NOIR": [
"Oriental, Floral",
"Bergamota, toronja",
"Rosa, jazmín, narciso",
"Pachulí, haba tonka, vainilla, sándalo",
3,
"n"
],
"Dama:CHANEL|GABRIELLE": [
"Floral",
"Mandarina, toronja, grosella",
"Jazmín, nardo, flor de naranjo, ylang-ylang",
"Almizcle, sándalo",
2,
"d"
],
"Dama:CHANEL|GABRIELLE EDP": [
"Floral",
"Mandarina, grosella, toronja",
"Jazmín, nardo, ylang-ylang",
"Almizcle, sándalo",
2,
"b"
],
"Dama:CHANEL|PARIS PARIS": [
"Floral",
"Notas verdes",
"Rosa",
"Almizcle, maderas",
2,
"d",
1
],
"Dama:CHLOE|CHLOE L'EAU": [
"Floral, Fresca",
"Notas acuáticas, menta",
"Rosa",
"Almizcle, cedro",
1,
"d"
],
"Dama:CHLOE|NOMADE": [
"Floral, Dulce",
"Ciruela mirabel, bergamota",
"Rosa, fresia",
"Musgo de roble, almizcle",
2,
"b"
],
"Dama:CHLOE|ROSES": [
"Floral",
"Rosa, lichi",
"Rosa",
"Almizcle",
1,
"d"
],
"Dama:CHOPARD|HAPPY SPIRIT": [
"Floral, Dulce",
"Frambuesa, mandarina",
"Jazmín, rosa",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CHRISTIAN AUDIGIER|ED HARDY": [
"Dulce, Floral",
"Fresa, mandarina",
"Jazmín, rosa",
"Vainilla, almizcle",
2,
"b"
],
"Dama:CHRISTIAN AUDIGIER|ED HARDY BORN WILD WOMAN": [
"Floral, Dulce",
"Frutos rojos",
"Jazmín, rosa",
"Vainilla, ámbar",
2,
"b",
1
],
"Dama:CHRISTIAN AUDIGIER|ED HARDY HEARTS & DAGGERS FOR HER": [
"Floral, Dulce",
"Frutas",
"Flores",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CHRISTIAN AUDIGIER|ED HARDY WOMAN EDT": [
"Dulce, Floral",
"Fresa, mandarina",
"Jazmín, pera",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:CLINIQUE|HAPPY": [
"Fresca, Floral",
"Toronja, bergamota, mandarina",
"Rosa, orquídea, muguete",
"Almizcle, maderas",
1,
"d"
],
"Dama:COACH|DREAM SUNSET": [
"Dulce, Floral",
"Pera, frambuesa",
"Rosa, jazmín",
"Vainilla, almizcle, sándalo",
2,
"b",
1
],
"Dama:COTY|EXCLAMATION": [
"Oriental, Floral",
"Durazno, ciruela, bergamota",
"Rosa, jazmín, clavel",
"Vainilla, sándalo, almizcle",
3,
"n"
],
"Dama:CREED|AVENTUS FOR HER": [
"Floral, Fresca",
"Limón, toronja, jengibre",
"Rosa, jazmín",
"Almizcle, pachulí",
2,
"b",
1
],
"Dama:CREED|CARMINA": [
"Floral, Oriental",
"Grosella negra, azafrán",
"Rosa, violeta, iris",
"Sándalo, almizcle, cedro",
2,
"n"
],
"Dama:CREED|IRIS TUBEROSE": [
"Floral",
"Bergamota, mandarina",
"Iris, tuberosa",
"Almizcle, maderas",
2,
"b",
1
],
"Dama:CREED|SPRING FLOWER": [
"Floral, Fresca",
"Manzana, bergamota, grosella",
"Jazmín, rosa, durazno",
"Almizcle, ámbar",
1,
"d"
],
"Dama:CREED|WIND FLOWERS": [
"Floral",
"Bergamota",
"Jazmín, gardenia",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:CUBA PARIS|CUBA TATOO": [
"Dulce, Floral",
"Frutas",
"Flores",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:DANA|TABU": [
"Oriental",
"Bergamota, naranja, especias",
"Jazmín, rosa, ylang-ylang",
"Ámbar, almizcle, pachulí",
3,
"n"
],
"Dama:DAVIDOFF|COOL WATER": [
"Fresca, Floral",
"Melón, pepino, membrillo",
"Loto, jazmín",
"Almizcle, sándalo",
1,
"d"
],
"Dama:DAVIDOFF|COOL WATER INTENSE HER": [
"Fresca, Floral",
"Mandarina, cítricos",
"Jazmín, notas marinas",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:DAVIDOFF|COOL WATER SEA ROSE CORAL REEF": [
"Floral, Fresca",
"Bergamota, notas marinas",
"Rosa",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:DEFINEME C.S.|BARBIE": [
"Dulce, Floral",
"Frutas",
"Flores",
"Vainilla, almizcle",
2,
"d",
1
],
"Dama:DESIGUAL|FRESH BLOOM": [
"Floral, Fresca",
"Cítricos",
"Flores blancas",
"Almizcle",
1,
"d",
1
],
"Dama:DIOR|ADDICT 2": [
"Floral, Fresca",
"Bergamota, mandarina",
"Rosa, gardenia",
"Almizcle, sándalo",
2,
"b"
],
"Dama:DIOR|DUNE": [
"Oriental, Floral",
"Mandarina, bergamota",
"Lirio, rosa, jazmín",
"Vainilla, sándalo, almizcle",
2,
"n"
],
"Dama:DIOR|EDEN ROC": [
"Fresca, Dulce",
"Bergamota, limón",
"Jazmín, notas marinas",
"Coco, almizcle",
1,
"d",
1
],
"Dama:DIOR|HOLY PEONY": [
"Floral",
"Pimienta rosa",
"Peonía, rosa",
"Almizcle",
1,
"d",
1
],
"Dama:DIOR|J'ADORE EAU LUMIERE": [
"Fresca, Floral",
"Cítricos, bergamota",
"Flores blancas",
"Almizcle",
1,
"d",
1
],
"Dama:DIOR|J'ADORE IN JOY": [
"Floral, Fresca",
"Sal, mandarina",
"Jazmín, rosa",
"Almizcle",
1,
"d",
1
],
"Dama:DIOR|J'ADORE INFINISSIME": [
"Floral",
"Mandarina",
"Rosa, jazmín, tuberosa",
"Almizcle",
2,
"b",
1
],
"Dama:DIOR|J'ADORE LUMIERE": [
"Floral, Fresca",
"Bergamota",
"Flores blancas",
"Almizcle",
1,
"d",
1
],
"Dama:DIOR|JOY BY DIOR": [
"Floral",
"Bergamota, mandarina",
"Rosa, jazmín",
"Almizcle, sándalo",
2,
"b",
1
],
"Dama:DIOR|MISS DIOR BLOOMING BOUQUET": [
"Floral, Fresca",
"Mandarina, toronja",
"Peonía, rosa",
"Almizcle blanco",
1,
"d"
],
"Dama:DIOR|MISS DIOR CHERIE": [
"Floral, Dulce",
"Mandarina, fresa",
"Rosa, jazmín",
"Pachulí, almizcle",
2,
"b",
1
],
"Dama:DIOR|MISS DIOR EAU DE PARFUM 2017": [
"Floral",
"Mandarina, bergamota",
"Rosa, peonía",
"Almizcle, pachulí",
2,
"b",
1
],
"Dama:DIOR|MISS DIOR PARFUM (2024)": [
"Floral, Dulce",
"Mandarina, frutos rojos",
"Jazmín, rosa",
"Vainilla, almizcle, pachulí",
2,
"b",
1
],
"Dama:DIOR|POISON": [
"Oriental, Dulce",
"Ciruela, cilantro, anís",
"Tuberosa, rosa, miel",
"Ámbar, vainilla, sándalo",
3,
"n"
],
"Dama:DIOR|POISON GIRL": [
"Dulce, Oriental",
"Naranja amarga, limón",
"Rosa",
"Vainilla, haba tonka, almizcle",
3,
"n"
],
"Dama:DIOR|TENDRE POISON": [
"Floral, Fresca",
"Notas verdes, mandarina",
"Rosa, flores blancas",
"Almizcle, sándalo",
1,
"d"
],
"Dama:DOLCE & GABBANA|ANTHOLOGY L'IMPERATRICE 3": [
"Fresca, Floral",
"Kiwi, ruibarbo, manzana",
"Sandía, ciclamen, jazmín",
"Almizcle, maderas",
1,
"d"
],
"Dama:DOLCE & GABBANA|DEVOTION": [
"Floral, Dulce",
"Limón, mandarina",
"Flor de naranjo",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:DOLCE & GABBANA|DOLCE & GABANA": [
"Floral",
"Mandarina, albahaca",
"Flor de naranjo, jazmín",
"Almizcle, vainilla",
2,
"b",
1
],
"Dama:DOLCE & GABBANA|DOLCE ROSE": [
"Floral",
"Pimienta rosa, mandarina",
"Rosa",
"Almizcle",
1,
"d",
1
],
"Dama:DOLCE & GABBANA|DOLCE VIOLET": [
"Floral, Fresca",
"Cítricos",
"Violeta",
"Almizcle",
1,
"d",
1
],
"Dama:DOLCE & GABBANA|DOLCE VITA": [
"Floral, Oriental",
"Bergamota, especias",
"Rosa, jazmín",
"Ámbar, vainilla, sándalo",
2,
"n",
1
],
"Dama:DOLCE & GABBANA|LIGHT BLUE FOREVER": [
"Fresca",
"Limón, toronja",
"Notas marinas, jazmín",
"Almizcle, ámbar",
1,
"d"
],
"Dama:DOLCE & GABBANA|LIGHT BLUE ITALIAN ZEST": [
"Fresca",
"Limón, naranja",
"Notas verdes",
"Almizcle, cedro",
1,
"d",
1
],
"Dama:DOLCE & GABBANA|LIGHT BLUE SUMMER VIBES": [
"Fresca, Floral",
"Cítricos",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:DOLCE & GABBANA|THE ONE": [
"Floral, Oriental",
"Bergamota, mandarina, lichi",
"Lirio, jazmín, ciruela",
"Vainilla, ámbar, almizcle",
3,
"n"
],
"Dama:DONNA KARAN|BE 100% DELICIOUS": [
"Fresca, Dulce",
"Manzana, mandarina",
"Flores",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:DONNA KARAN|BE DELICIOUS ELECTRIC BRIGHTCRUSH": [
"Fresca, Floral",
"Manzana, cítricos",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:DONNA KARAN|DKNY BE DESIRED": [
"Floral, Dulce",
"Frutas, cítricos",
"Flores",
"Almizcle, vainilla",
2,
"b",
1
],
"Dama:DONNA KARAN|DKNY MY NY": [
"Floral, Fresca",
"Bergamota, frutas",
"Jazmín, rosa",
"Almizcle",
1,
"d",
1
],
"Dama:DONNA KARAN|DKNY STORIES": [
"Floral, Dulce",
"Pera, frambuesa",
"Jazmín",
"Almizcle, maderas",
1,
"b",
1
],
"Dama:DONNA KARAN|RED DELICIOUS": [
"Dulce, Floral",
"Manzana roja, frutos rojos",
"Flores",
"Almizcle, vainilla",
2,
"b",
1
],
"Dama:ELIE SAAB|GIRL OF NOW": [
"Dulce, Floral",
"Bergamota, pera",
"Flor de naranjo, almendra",
"Haba tonka, almizcle",
2,
"b",
1
],
"Dama:ELIZABETH ARDEN|GREEN TEA": [
"Fresca, Aromática",
"Té verde, limón, menta",
"Jazmín, clavel",
"Almizcle, ámbar",
1,
"d"
],
"Dama:ELIZABETH ARDEN|RED DOOR": [
"Floral, Oriental",
"Ciruela, durazno",
"Rosa, jazmín, clavel",
"Miel, ámbar, sándalo",
3,
"n"
],
"Dama:ELIZABETH ARDEN|SUNFLOWERS SUMMER AIR": [
"Fresca, Floral",
"Cítricos",
"Girasol, flores",
"Almizcle",
1,
"d",
1
],
"Dama:ELIZABETH ARDEN|WHITE TEA": [
"Fresca, Floral",
"Té blanco",
"Flores blancas",
"Almizcle, ámbar",
1,
"d"
],
"Dama:ELIZABETH TAYLOR|PASSION": [
"Oriental, Floral",
"Ciruela, especias",
"Gardenia, jazmín, rosa",
"Pachulí, ámbar, sándalo",
3,
"n"
],
"Dama:ELIZABETH TAYLOR|PERLES NOIRES": [
"Floral, Oriental",
"Pimienta, bergamota",
"Rosa, jazmín",
"Vainilla, sándalo, almizcle",
3,
"n"
],
"Dama:ELIZABETH TAYLOR|WHITE DIAMONDS": [
"Floral",
"Aldehídos, neroli",
"Rosa, jazmín, tuberosa",
"Ámbar, sándalo, almizcle",
3,
"n"
],
"Dama:EMANUEL UNGARO|UNGARO": [
"Floral, Oriental",
"Bergamota",
"Jazmín, rosa",
"Almizcle, sándalo",
2,
"b",
1
],
"Dama:ENRIQUE IGLESIAS|DEEPLY YOURS FOR HER": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:ESCADA|CANDY LOVE": [
"Dulce, Floral",
"Frambuesa, limón, manzana",
"Caramelo, flores",
"Almizcle, cachemira",
2,
"b"
],
"Dama:ESCADA|CELEBRATE N.O.W.": [
"Floral, Fresca",
"Cítricos, frutas",
"Flores blancas",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|CHERRY IN THE AIR": [
"Dulce, Floral",
"Cereza, bergamota",
"Rosa, malvavisco",
"Almizcle, maderas",
2,
"d"
],
"Dama:ESCADA|FRUIT CRUSH": [
"Dulce, Fresca",
"Frambuesa, sandía, toronja",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|ISLAND KISS": [
"Dulce, Fresca",
"Maracuyá, mango",
"Flor de cerezo",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|JOYFUL MOMENTS": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:ESCADA|MARINE GROOVE": [
"Fresca, Dulce",
"Kiwi, melón, cítricos",
"Flores acuáticas",
"Almizcle, maderas",
1,
"d",
1
],
"Dama:ESCADA|MIAMI BLOSSOM": [
"Floral, Dulce",
"Lichi, toronja",
"Flores tropicales",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|MOON SPARKLE WOMAN": [
"Dulce, Fresca",
"Frambuesa, grosella negra",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|PACIFIC PARADISE": [
"Fresca, Dulce",
"Frutas tropicales, cítricos",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|SANTORINI SUNRISE": [
"Fresca, Dulce",
"Frutas, cítricos",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|SEXY GRAFFITI": [
"Dulce, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:ESCADA|SHOW ME LOVE": [
"Dulce, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:ESCADA|SORBETTO ROSSO": [
"Dulce, Fresca",
"Frutos rojos, sandía",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|TAJ SUNSET": [
"Dulce, Fresca",
"Mango, cítricos",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:ESCADA|TROPICAL PUNCH": [
"Dulce, Fresca",
"Piña, frutas tropicales",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:EST�E LAUDER|BEAUTIFUL": [
"Floral",
"Rosa, lirio, mandarina",
"Jazmín, tuberosa, ylang-ylang",
"Sándalo, vetiver, almizcle",
3,
"b"
],
"Dama:EST�E LAUDER|BEAUTIFUL MAGNOLIA": [
"Floral",
"Bergamota",
"Magnolia, jazmín",
"Almizcle, maderas",
2,
"b",
1
],
"Dama:EST�E LAUDER|BEYOND PARADISE WOMAN": [
"Fresca, Floral",
"Notas verdes, cítricos",
"Flores tropicales",
"Maderas, almizcle",
1,
"d",
1
],
"Dama:EST�E LAUDER|ESTEE LAUDER": [
"Floral, Oriental",
"Aldehídos, durazno",
"Rosa, jazmín",
"Ámbar, almizcle",
2,
"n",
1
],
"Dama:EST�E LAUDER|PLEASURE FLORALES": [
"Floral",
"Notas verdes",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:EST�E LAUDER|PLEASURES": [
"Floral, Fresca",
"Notas verdes, bergamota",
"Peonía, lila, violeta",
"Almizcle, sándalo",
1,
"d"
],
"Dama:GERMAINE MONTEIL|ROYAL SECRET": [
"Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:GIVENCHY|AMARIGE": [
"Floral",
"Mimosa, durazno",
"Gardenia, rosa, ylang-ylang",
"Sándalo, vainilla, almizcle",
3,
"b"
],
"Dama:GIVENCHY|ANGE OU DEMON": [
"Oriental, Floral",
"Mandarina, azafrán",
"Lirio, ylang-ylang, orquídea",
"Haba tonka, vainilla, maderas",
3,
"n"
],
"Dama:GIVENCHY|ANGE OU DEMON LE SECRET": [
"Floral, Fresca",
"Té, frambuesa, limón",
"Jazmín, peonía",
"Maderas, almizcle",
2,
"b"
],
"Dama:GIVENCHY|DAHLIA DIVIN": [
"Floral, Amaderada",
"Pera, cítricos",
"Jazmín, dalia",
"Sándalo, vetiver, almizcle",
2,
"b"
],
"Dama:GIVENCHY|EAU DEMOISELLE ESSENCE DES PALAIS": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:GIVENCHY|IRRESISTIBLE": [
"Floral",
"Pera, cítricos",
"Rosa",
"Almizcle, ámbar",
2,
"b"
],
"Dama:GIVENCHY|IRRESISTIBLE EAU DE TOILETTE": [
"Floral, Fresca",
"Pera, cítricos",
"Rosa",
"Almizcle",
1,
"d"
],
"Dama:GIVENCHY|L'INTERDIT": [
"Floral, Amaderada",
"Pera, bergamota",
"Flor de naranjo, nardo, jazmín",
"Pachulí, vetiver, vainilla, ámbar",
2,
"b"
],
"Dama:GIVENCHY|L'INTERDIT EDP ROUGE": [
"Floral, Oriental",
"Jengibre, naranja sanguina",
"Flores blancas",
"Pachulí, sándalo, vainilla",
3,
"n"
],
"Dama:GIVENCHY|ORGANZA": [
"Floral, Oriental",
"Gardenia, notas verdes",
"Tuberosa, jazmín",
"Vainilla, ámbar, cedro",
3,
"n"
],
"Dama:GIVENCHY|PI": [
"Oriental, Dulce",
"Mandarina, albahaca",
"Almendra, cedro",
"Vainilla, haba tonka, benjuí",
3,
"n"
],
"Dama:GIVENCHY|VERY IRRESISTIBLE": [
"Floral",
"Anís, pimienta rosa",
"Rosa",
"Almizcle, maderas",
2,
"b"
],
"Dama:GLORIA VANDERBILT|GLORIA VANDERBILT": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:GUCCI|BAMBOO": [
"Floral, Amaderada",
"Bergamota, cardamomo",
"Ylang-ylang, flor de naranjo",
"Sándalo, ámbar, vainilla",
2,
"b"
],
"Dama:GUCCI|FLORA": [
"Floral, Dulce",
"Mandarina, pimienta rosa",
"Rosa, osmanto",
"Pachulí, sándalo",
2,
"b"
],
"Dama:GUCCI|FLORA GEORGOUS JAZMIN": [
"Floral",
"Mandarina",
"Jazmín",
"Almizcle",
2,
"d",
1
],
"Dama:GUCCI|FLORA GORGEOUS GARDENIA": [
"Floral, Dulce",
"Pera",
"Gardenia, jazmín",
"Azúcar morena, almizcle",
2,
"b"
],
"Dama:GUCCI|FLORA GORGEOUS MAGNOLIA": [
"Floral",
"Mandarina",
"Magnolia",
"Sándalo, almizcle",
2,
"d",
1
],
"Dama:GUCCI|FLORA GORGEOUS ORCHID": [
"Floral, Dulce",
"Mandarina",
"Orquídea",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:GUCCI|GUCCI BLOOM": [
"Floral",
"Flores blancas",
"Tuberosa, jazmín",
"Rangún, almizcle",
2,
"d"
],
"Dama:GUCCI|GUCCI BLOOM INTENSE EDP": [
"Floral",
"Flores blancas",
"Tuberosa, jazmín",
"Ámbar, almizcle",
3,
"b",
1
],
"Dama:GUCCI|GUCCI BLOOM NETTARE DI FIORI": [
"Floral",
"Flores blancas",
"Rosa, tuberosa",
"Osmanto, almizcle",
2,
"b",
1
],
"Dama:GUCCI|GUCCI FEMME": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:GUCCI|GUCCI GUILTY ABSOLUTE": [
"Oriental, Amaderada",
"Cuero",
"Rosa, pachulí",
"Vetiver, maderas",
3,
"n",
1
],
"Dama:GUCCI|GUCCI RUSH": [
"Oriental, Floral",
"Mandarina, gardenia",
"Pachulí, rosa",
"Vainilla, vetiver",
3,
"n"
],
"Dama:GUCCI|GUILTY ELIXIR DE PARFUM POUR FEMME": [
"Oriental, Floral",
"Mandarina, pimienta rosa",
"Rosa, jazmín",
"Pachulí, vainilla, ámbar",
3,
"n"
],
"Dama:GUERLAIN|LA PETITE ROBE NOIRE": [
"Dulce, Oriental",
"Cereza negra, almendra, bergamota",
"Rosa, té",
"Vainilla, pachulí, haba tonka",
3,
"n"
],
"Dama:GUERLAIN|LA PETITE ROBE NOIRE INTENSE": [
"Dulce, Oriental",
"Cereza negra, almendra",
"Rosa",
"Vainilla, pachulí",
3,
"n",
1
],
"Dama:GUERLAIN|METEORITES": [
"Floral",
"Violeta, bergamota",
"Rosa, iris",
"Almizcle",
1,
"d",
1
],
"Dama:GUERLAIN|MON GUERLAIN (ANGELINA JOLIE)": [
"Oriental, Dulce",
"Bergamota, lavanda",
"Jazmín sambac, rosa",
"Vainilla, sándalo, haba tonka",
3,
"n"
],
"Dama:GUERLAIN|SAMSARA": [
"Oriental, Amaderada",
"Bergamota, limón",
"Jazmín, iris, narciso",
"Sándalo, vainilla, haba tonka",
3,
"n"
],
"Dama:GUESS|BELLA VITA ROSA": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:GUESS|GUESS FOR WOMAN": [
"Floral, Dulce",
"Mandarina, grosella",
"Flores",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:GUESS|GUESS GIRL BELLE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:GUESS|GUESS GOLD": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:HERMES|KELLY CALECHE": [
"Floral",
"Limón, mandarina",
"Rosa, jazmín",
"Almizcle, cuero",
2,
"b",
1
],
"Dama:HERMES|TWILLY EAU GINGER": [
"Floral, Fresca",
"Jengibre, cítricos",
"Rosa",
"Sándalo, almizcle",
2,
"d"
],
"Dama:HUGO BOSS|BOSS ALIVE": [
"Floral, Dulce",
"Manzana, ciruela, durazno",
"Jazmín, flor de naranjo",
"Vainilla, sándalo, cedro",
2,
"b"
],
"Dama:HUGO BOSS|BOSS ALIVE INTENSE": [
"Oriental, Dulce",
"Manzana, pimienta rosa",
"Jazmín, flor de naranjo",
"Vainilla, sándalo",
3,
"n",
1
],
"Dama:HUGO BOSS|BOSS FEMME": [
"Floral, Dulce",
"Durazno, grosella",
"Jazmín, rosa",
"Ámbar, sándalo",
2,
"b",
1
],
"Dama:HUGO BOSS|BOSS NUIT POUR FEMME": [
"Floral, Dulce",
"Durazno, mandarina",
"Fresia, jazmín",
"Vainilla, almizcle",
2,
"n",
1
],
"Dama:HUGO BOSS|BOSS ORANGE": [
"Floral, Dulce",
"Manzana",
"Flor de naranjo",
"Vainilla, sándalo",
2,
"b",
1
],
"Dama:HUGO BOSS|BOSS WOMAN": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:HUGO BOSS|DEEP RED": [
"Oriental, Floral",
"",
"",
"",
2,
"n",
1
],
"Dama:HUGO BOSS|HUGO EAU DE PARFUM": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:HUGO BOSS|HUGO XX": [
"Fresca, Floral",
"Toronja, mandarina",
"Pepino, flores",
"Almizcle, pachulí",
1,
"d",
1
],
"Dama:HUGO BOSS|THE SCENT": [
"Oriental, Floral",
"Durazno, bergamota",
"Flor de osmanto",
"Cacao, almizcle",
2,
"n"
],
"Dama:HUGO BOSS|THE SCENT PRIVATE": [
"Oriental, Floral",
"",
"",
"",
2,
"n",
1
],
"Dama:HUGO BOSS|XX HUGO BOSS": [
"Fresca, Floral",
"Toronja, mandarina",
"Pepino, flores",
"Almizcle, pachulí",
1,
"d",
1
],
"Dama:ISSEY MIYAKE|A DROP D'ISSEY": [
"Floral",
"Rosa",
"Rosa, muguete",
"Almizcle",
1,
"d",
1
],
"Dama:JEAN CHARLES BROSSEAU|OMBRE RUBIS": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:JEAN PAUL GAULTIER|I LOVE GAULTIER CLASSIQUE": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:JEAN PAUL GAULTIER|JEAN PAUL GAULTIER": [
"Floral, Oriental",
"Naranja, rosa",
"Jengibre, iris",
"Vainilla, almizcle",
2,
"n",
1
],
"Dama:JEAN PAUL GAULTIER|LA BELLE": [
"Dulce, Oriental",
"Pera",
"Vainilla",
"Haba tonka, ámbar",
3,
"n"
],
"Dama:JEAN PAUL GAULTIER|LA BELLE FLEUR TERRIBLE": [
"Floral, Dulce",
"Pera",
"Tuberosa",
"Vainilla, ámbar",
3,
"n",
1
],
"Dama:JEAN PAUL GAULTIER|LA BELLE PARADISE GARDEN": [
"Floral, Dulce",
"",
"",
"",
2,
"d",
1
],
"Dama:JEAN PAUL GAULTIER|SCANDAL GOLD": [
"Dulce, Floral",
"Mandarina",
"Miel, gardenia",
"Pachulí",
3,
"n",
1
],
"Dama:JEAN PAUL GAULTIER|SCANDAL LE PARFUM": [
"Dulce, Oriental",
"Mandarina",
"Miel, gardenia",
"Pachulí, caramelo",
3,
"n",
1
],
"Dama:JEAN PAUL GAULTIER|SO SCANDAL!": [
"Floral, Dulce",
"Frambuesa",
"Flor de naranjo, nardo",
"Pachulí, almizcle",
3,
"n",
1
],
"Dama:JENNIFER ANISTON|LOLAVIE": [
"Floral, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Dama:JENNIFER LOPEZ|GLOW": [
"Floral, Fresca",
"Toronja, bergamota, flor de naranjo",
"Rosa, jazmín",
"Almizcle, ámbar, sándalo",
1,
"d"
],
"Dama:JENNIFER LOPEZ|MIAMI GLOW": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:JESUS DEL POZO|HALLOWEEN": [
"Floral, Fresca",
"Violeta, limón",
"Magnolia, rosa",
"Almizcle, sándalo",
1,
"d",
1
],
"Dama:JESUS DEL POZO|HALLOWEEN BLOSSOM": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:JESUS DEL POZO|HALLOWEEN KISS": [
"Dulce, Floral",
"Mandarina, frambuesa",
"Jazmín, rosa",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:JESUS DEL POZO|HALLOWEEN TATOO WOMAN": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:JIMMY CHOO|I WANT CHOO FOREVER": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:JIMMY CHOO|JIMMY CHOO FEVER": [
"Dulce, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:JO MALONE|PEONY & BLUSH SUEDE": [
"Floral, Amaderada",
"Manzana roja",
"Peonía, rosa, jazmín",
"Gamuza",
2,
"b"
],
"Dama:JO MALONE|RED ROSES COLOGNE (2023)": [
"Floral",
"Limón",
"Rosa",
"Almizcle",
1,
"d",
1
],
"Dama:JUICY COUTURE|I LOVE JUICY COUTURE": [
"Floral, Dulce",
"Malvavisco, frutas",
"Flores",
"Almizcle",
2,
"b",
1
],
"Dama:JUICY COUTURE|OUI JUICY COUTURE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:JUICY COUTURE|VIVA LA JUICY": [
"Dulce, Floral",
"Mandarina, frutos rojos",
"Madreselva, gardenia, jazmín",
"Caramelo, vainilla, ámbar",
2,
"b"
],
"Dama:JUICY COUTURE|VIVA LA JUICY BUBBLY": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:JUICY COUTURE|VIVA LA JUICY NEON": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:JUICY COUTURE|VIVA LA JUICY ROSE": [
"Floral, Dulce",
"Mandarina, frambuesa",
"Rosa",
"Caramelo, almizcle",
2,
"b",
1
],
"Dama:JUSTIN BIEBER|NEXT GIRLFRIEND": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:JUSTIN BIEBER|SOMEDAY": [
"Dulce, Floral",
"Pera, mandarina",
"Jazmín, flores",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:JUSTIN BIEBER|THE KEY": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:KATY PERRY|KILLER QUEEN": [
"Floral, Dulce",
"",
"",
"",
2,
"n",
1
],
"Dama:KATY PERRY|MAD LOVE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KATY PERRY|MAD POTION": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:KATY PERRY|SPRING REIGN": [
"Floral",
"",
"",
"",
2,
"d",
1
],
"Dama:KAYALI|VANILLA CANDY ROCK SUGAR | 42": [
"Dulce",
"Bergamota",
"Vainilla, azúcar",
"Almizcle, ámbar",
3,
"b",
1
],
"Dama:KENZO|FLOWER BY KENZO": [
"Floral, Oriental",
"Mandarina, grosella",
"Amapola, rosa, violeta",
"Vainilla, almizcle, incienso",
2,
"b"
],
"Dama:KENZO|FLOWER BY KENZO L'ABSOLUE": [
"Oriental, Floral",
"Mandarina, grosella",
"Amapola, rosa",
"Vainilla, incienso, ámbar",
3,
"n",
1
],
"Dama:KENZO|FLOWER BY KENZO L'ELIXIR": [
"Oriental, Floral",
"Frambuesa",
"Rosa, amapola",
"Vainilla, incienso",
3,
"n",
1
],
"Dama:KENZO|FLOWER BY KENZO POPPY": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:KENZO|FLOWERS": [
"Floral, Oriental",
"Mandarina, grosella",
"Rosa, violeta",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:KENZO|KENZO MADLY": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KENZO|KENZO WORLD INTENSE": [
"Floral, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:KENZO|L'EAU PAR KENZO": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:KENZO|THE NEW KENZO FLOWER": [
"Floral, Oriental",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|BABY GIRL": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|BADDIE": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|BAE": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|BFF": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|BODY": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|CRYSTAL GARDENIA OUD": [
"Oriental, Floral",
"",
"",
"",
3,
"n",
1
],
"Dama:KIM KARDASHIAN|DIAMOND KIM": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|DIAMOND PINK": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|DIAMOND YELLOW": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|KIMOJI CHERRY": [
"Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|LIPS NUDE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|LIPS PINK": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KIM KARDASHIAN|LIPS RED": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:KIM KARDASHIAN|RIDE OR DIE": [
"Dulce, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:KIM KARDASHIAN|WIFEY": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:KYLIE COSMETICS|COSMIC KYLIE JENNER": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:LACOSTE|12.12 EAU FRAICHE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:LACOSTE|12.12 EDP ROSE FOR HER": [
"Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:LACOSTE|12.12 ELEGANT": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:LACOSTE|12.12 MAGNETIC": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:LACOSTE|12.12 NATURAL": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:LACOSTE|12.12 ROSE EAU INTENSE": [
"Floral",
"",
"",
"",
2,
"d",
1
],
"Dama:LACOSTE|12.12 SPARKLING": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:LACOSTE|12.12 SPARKLING COLLECTOR": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:LACOSTE|JOY OF PINK": [
"Floral, Dulce",
"Toronja, manzana",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:LACOSTE|L.12.12 ROSE EAU INTENSE": [
"Floral",
"",
"",
"",
2,
"d",
1
],
"Dama:LACOSTE|LACOSTE FEMME": [
"Floral",
"Fresia, frambuesa",
"Jazmín",
"Almizcle, cachemira",
1,
"d",
1
],
"Dama:LACOSTE|LACOSTE POUR FEMME TIMELESS": [
"Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:LACOSTE|TOUCH OF PINK": [
"Floral, Dulce",
"Toronja, mandarina, grosella",
"Violeta, jazmín, gardenia",
"Vainilla, almizcle, sándalo",
1,
"d"
],
"Dama:LADY GAGA|EAU DE GAGA": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:LANCOME|HYPNOSE": [
"Oriental, Floral",
"Maracuyá, notas verdes",
"Jazmín, gardenia",
"Vainilla, vetiver",
2,
"n"
],
"Dama:LANCOME|IDOLE": [
"Floral",
"Bergamota, pera",
"Rosa, jazmín",
"Almizcle, cedro",
2,
"b"
],
"Dama:LANCOME|IDOLE AURA": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:LANCOME|IDOLE NECTAR": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:LANCOME|LA NUIT TRESOR": [
"Dulce, Oriental",
"Pera, cítricos",
"Rosa, praliné",
"Vainilla, pachulí, papiro",
3,
"n"
],
"Dama:LANCOME|LA NUIT TRESOR FLEUR DE NUIT": [
"Dulce, Floral",
"",
"",
"",
3,
"n",
1
],
"Dama:LANCOME|LA VIE EST BELLE INTENSEMENT": [
"Dulce, Oriental",
"Grosella negra, pera",
"Iris, jazmín",
"Praliné, vainilla, pachulí",
3,
"n",
1
],
"Dama:LANCOME|LA VIE EST BELLE IRIS ABSOLU": [
"Dulce, Floral",
"Pera",
"Iris",
"Praliné, vainilla",
3,
"b",
1
],
"Dama:LANCOME|LA VIE EST BELLE L'ECLAT": [
"Dulce, Floral",
"Mandarina",
"Flor de naranjo",
"Praliné, vainilla",
2,
"b",
1
],
"Dama:LANCOME|LA VIE EST BELLE L'EVEIL": [
"Floral, Dulce",
"",
"",
"",
2,
"d",
1
],
"Dama:LANCOME|LA VIE EST BELLE L'EXTRAIT": [
"Dulce, Oriental",
"Grosella negra",
"Iris",
"Vainilla, praliné, pachulí",
3,
"n",
1
],
"Dama:LANCOME|LA VIE EST BELLE SOLEIL CRISTAL": [
"Dulce, Fresca",
"",
"",
"",
2,
"d",
1
],
"Dama:LANCOME|MAGNIFIQUE": [
"Oriental, Floral",
"Azafrán, pimienta rosa",
"Rosa, jazmín",
"Sándalo, madera de nagarmotha, haba tonka",
3,
"n"
],
"Dama:LANCOME|MAISON LANCOME JASMIN D'EAU": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:LANCOME|MAISON LANCOME MILLE ET UNE ROSES": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:LANCOME|MAISON LANCOME ROSE PEONIA": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:LANCOME|MILLE ET UNE ROSES": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:LANCOME|MIRACLE": [
"Floral, Oriental",
"Mandarina, lichi, fresia",
"Magnolia, pimienta, jengibre",
"Almizcle, ámbar",
2,
"b"
],
"Dama:LANCOME|O OUI": [
"Floral, Fresca",
"Mandarina",
"Rosa, jazmín",
"Almizcle",
1,
"d",
1
],
"Dama:LANCOME|OUI LA VIE EST BELLE": [
"Floral, Dulce",
"Frambuesa",
"Rosa",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:LANCOME|POEME": [
"Floral, Oriental",
"Mandarina",
"Mimosa, datura",
"Vainilla, ámbar",
3,
"n",
1
],
"Dama:LANCOME|TRESOR": [
"Floral, Oriental",
"Durazno, rosa, piña",
"Rosa, iris, lila",
"Vainilla, ámbar, sándalo",
3,
"b"
],
"Dama:LANCOME|TRESOR MIDNIGHT ROSE": [
"Floral, Dulce",
"Grosella negra, frambuesa",
"Rosa, jazmín",
"Vainilla, pachulí",
3,
"n"
],
"Dama:LANVIN|ECLAT D'ARPEGE": [
"Floral, Fresca",
"Lila, hojas verdes",
"Peonía, glicina, rosa",
"Almizcle, cedro",
1,
"d"
],
"Dama:LANVIN|ECLAT D'ARPEGE MON ECLAT": [
"Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:LATTAFA|HAYA": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:LATTAFA|MAYAR": [
"Floral, Dulce",
"Lichi, frambuesa",
"Jazmín",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:LATTAFA|MAYAR NATURAL INTENSA": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:LATTAFA|YARA": [
"Dulce, Floral",
"Orquídea, heliotropo, mandarina",
"Frutas tropicales, gourmand",
"Vainilla, almizcle, sándalo",
3,
"b"
],
"Dama:LATTAFA|YARA CANDY": [
"Dulce",
"",
"",
"",
3,
"b",
1
],
"Dama:LATTAFA|YARA MOI": [
"Dulce, Floral",
"",
"",
"",
3,
"b",
1
],
"Dama:LATTAFA|YARA TOUS": [
"Dulce, Fresca",
"",
"",
"",
3,
"b",
1
],
"Dama:LOEWE|SOLO ELLA ELIXIR": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Dama:LOEWE|SOLO LOEWE FOR ELLA": [
"Floral, Fresca",
"Cítricos, frutas",
"Flores blancas",
"Almizcle",
2,
"d",
1
],
"Dama:LOLITA LEMPICKA|L'AIME": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:LOLITA LEMPICKA|LOLITA LEMPICKA WOMAN": [
"Dulce, Oriental",
"Hiedra, anís",
"Regaliz, violeta, cereza",
"Vainilla, haba tonka, almizcle",
3,
"n"
],
"Dama:LOUIS VUITTON|ROSE DES VENTS": [
"Floral",
"Pimienta rosa",
"Rosa",
"Almizcle, maderas",
2,
"b",
1
],
"Dama:MAISON FRANCIS KURKDJIAN|LIQUID GOLD": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Dama:MAISON MARTIN MARGIELA|BEACH WALK": [
"Fresca, Floral",
"Limón, bergamota, pimienta rosa",
"Coco, ylang-ylang",
"Almizcle, cedro",
1,
"d"
],
"Dama:MALUMA|AMETHYST ROYALTY EDP": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:MANCERA|ROSES VANILLE": [
"Dulce, Floral",
"Rosa",
"Vainilla",
"Ámbar, almizcle",
3,
"b"
],
"Dama:MARC JACOBS|DAISY": [
"Floral",
"Fresa, violeta, toronja",
"Gardenia, jazmín, violeta",
"Almizcle, vainilla, maderas",
2,
"d"
],
"Dama:MARC JACOBS|DAISY EAU SO FRESH": [
"Floral, Fresca",
"Frambuesa, toronja, pera",
"Rosa, violeta, jazmín",
"Almizcle, cedro, ciruela",
1,
"d"
],
"Dama:MARC JACOBS|DAISY LOVE SKIES": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:MARC JACOBS|DAISY SKIES": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:MARC JACOBS|DECADENCE": [
"Oriental, Floral",
"Ciruela, hojas de ciruelo, azafrán",
"Iris, rosa, jazmín",
"Ámbar, papiro, gamuza",
3,
"n"
],
"Dama:MARC JACOBS|DIVINE DECADENCE": [
"Oriental, Floral",
"",
"",
"",
3,
"n",
1
],
"Dama:MARC JACOBS|HONEY": [
"Floral, Dulce",
"Pera, mandarina, durazno",
"Flor de naranjo, madreselva",
"Miel, vainilla",
2,
"b"
],
"Dama:MARC JACOBS|PERFECT": [
"Floral, Dulce",
"Ruibarbo, narciso",
"Leche de almendras",
"Cachemira, cedro",
2,
"b"
],
"Dama:MARC JACOBS|PERFECT EDT": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:MARC JACOBS|SI LOLITA": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:MARIA SHARAPOVA|MARIA SHARAPOVA": [
"Floral",
"",
"",
"",
2,
"d",
1
],
"Dama:MARIAH CARREY|LUSCIOUS PINK": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:MICHAEL KORS|SUPER GORGEOUS": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:MIU MIU|MIU MIU": [
"Floral, Fresca",
"Lirio de los valles",
"Rosa, lirio",
"Akigalawood",
2,
"b",
1
],
"Dama:MIU MIU|TWIST EAU DE MAGNOLIA": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:MOLSHEIM & CO|GOLD": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:MONTALE|ROSES MUSK": [
"Floral, Oriental",
"Rosa",
"Almizcle",
"Ámbar",
2,
"b",
1
],
"Dama:MONTBLANC|LADY EMBLEM": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:MONTBLANC|LEGEND": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:MOSCHINO|FRESH COUTURE": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:MOSCHINO|GLAMOUR": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:MOSCHINO|GOLD FRESH COUTURE": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:MOSCHINO|MOSCHINO FUNNY!": [
"Fresca, Dulce",
"Naranja, toronja",
"Té verde, jazmín",
"Almizcle, vainilla",
1,
"d",
1
],
"Dama:MOSCHINO|SO REAL CHIP & CHIC": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:MOSCHINO|TOY": [
"Floral, Oriental",
"",
"",
"",
2,
"b",
1
],
"Dama:MOSCHINO|TOY 2 BUMBLE GUM": [
"Dulce, Floral",
"Chicle, cítricos",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:MUGLER|ALIEN": [
"Floral, Amaderada",
"Jazmín sambac",
"Madera de cachemira",
"Ámbar blanco",
3,
"b"
],
"Dama:MUGLER|ALIEN GODDESS": [
"Floral, Dulce",
"Bergamota, jengibre",
"Jazmín, vainilla",
"Benjuí, cedro",
3,
"b"
],
"Dama:MUGLER|ANGEL EAU CROISIERES": [
"Dulce, Fresca",
"",
"",
"",
2,
"d",
1
],
"Dama:MUGLER|ANGEL EDT 2019": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:MUGLER|ANGEL ELIXIR": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:MUGLER|AURA": [
"Floral, Oriental",
"Notas verdes",
"Flores tropicales",
"Vainilla, maderas",
2,
"n",
1
],
"Dama:NARCISO RODRIGUEZ|FLEUR MUSC FOR HER": [
"Floral",
"Almizcle, rosa",
"Almizcle, peonía",
"Pachulí, maderas",
2,
"b",
1
],
"Dama:NARCISO RODRIGUEZ|NARCISO": [
"Floral",
"Gardenia, flor de naranjo",
"Rosa, almizcle",
"Vetiver, cedro",
2,
"b"
],
"Dama:NARCISO RODRIGUEZ|NARCISO EAU DE PARFUM CRISTAL": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:NARCISO RODRIGUEZ|NARCISO POUDRE": [
"Floral",
"Rosa, jazmín",
"Almizcle",
"Vetiver, cedro",
2,
"b"
],
"Dama:NAUTICA|NAUTICA WOMAN": [
"Fresca, Floral",
"Melón, notas acuáticas",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:NICKY MINAJ|MINAJESTY": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:NICKY MINAJ|TRINI GIRL": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:NINA RICCI|L'AIR DU TEMPS": [
"Floral",
"Clavel, bergamota, durazno",
"Gardenia, jazmín, rosa, iris",
"Sándalo, almizcle, vetiver",
2,
"d"
],
"Dama:NINA RICCI|L'EXTASE CARESSE DE ROSES": [
"Floral, Oriental",
"Rosa, pimienta rosa",
"Rosa",
"Almizcle, pachulí",
2,
"n",
1
],
"Dama:NINA RICCI|LES MONSTRES DE NINA": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:NINA RICCI|LES MONSTRES LUNA": [
"Dulce, Floral",
"Mandarina, naranja",
"Flor de naranjo, praliné",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:NINA RICCI|LES MONSTRES LUNA BLOSSOM": [
"Floral, Dulce",
"",
"",
"",
2,
"d",
1
],
"Dama:NINA RICCI|LUNA": [
"Dulce, Floral",
"Mandarina, naranja",
"Flor de naranjo, praliné",
"Vainilla, almizcle",
2,
"b"
],
"Dama:NINA RICCI|NINA EXTRA ROUGE": [
"Dulce, Fresca",
"Manzana roja, pomelo",
"Praliné, rosa",
"Almizcle, maderas",
2,
"b",
1
],
"Dama:NINA RICCI|NINA POP": [
"Dulce, Fresca",
"",
"",
"",
2,
"d",
1
],
"Dama:NINA RICCI|NINA RICCI": [
"Dulce, Fresca",
"Manzana, limón",
"Praliné, peonía",
"Cedro, almizcle",
2,
"d",
1
],
"Dama:NINA RICCI|NINA SOLEIL": [
"Dulce, Fresca",
"",
"",
"",
2,
"d",
1
],
"Dama:ONE DIRECTION|BETWEEN US": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:ONE DIRECTION|OUR MOMENT": [
"Floral, Dulce",
"Toronja, frambuesa",
"Jazmín, peonía",
"Almizcle, pachulí",
2,
"b"
],
"Dama:ONE DIRECTION|THAT MOMENT": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:ORIENTICA PREMIUM|FLEUR": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:ORIENTICA PREMIUM|MELODIE EDP": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:ORIENTICA PREMIUM|VELVET GOLD": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Dama:OSCAR DE LA RENTA|ALIBI EDP": [
"Floral, Dulce",
"Frambuesa, pera",
"Flores blancas",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:OSCAR DE LA RENTA|OSCAR DE LA RENTA": [
"Floral, Oriental",
"Albahaca, durazno",
"Gardenia, jazmín, rosa",
"Vainilla, sándalo, ámbar",
3,
"n"
],
"Dama:PACO RABANNE|BLACK XS LOS ANGELES FOR HER": [
"Dulce, Floral",
"",
"",
"",
2,
"n",
1
],
"Dama:PACO RABANNE|LADY MILLION": [
"Dulce, Floral",
"Frambuesa, neroli, limón",
"Gardenia, jazmín, flor de naranjo",
"Miel, pachulí, ámbar",
3,
"n"
],
"Dama:PACO RABANNE|LADY MILLION EAU MY GOLD": [
"Dulce, Floral",
"",
"",
"",
2,
"d",
1
],
"Dama:PACO RABANNE|LADY MILLION EMPIRE": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:PACO RABANNE|LADY MILLION FABULOUS": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:PACO RABANNE|LADY MILLION LUCKY": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PACO RABANNE|LADY MILLION ROYAL": [
"Dulce, Floral",
"",
"",
"",
3,
"n",
1
],
"Dama:PACO RABANNE|OLYMPEA AQUA": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:PACO RABANNE|OLYMPEA BLOSSOM": [
"Floral, Dulce",
"",
"",
"",
2,
"d",
1
],
"Dama:PACO RABANNE|OLYMPEA LEGEND": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:PACO RABANNE|OLYMPEA SOLAR": [
"Dulce, Fresca",
"",
"",
"",
2,
"d",
1
],
"Dama:PACO RABANNE|PURE XS": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:PACO RABANNE|ULTRAVIOLET": [
"Oriental, Floral",
"",
"",
"",
2,
"n",
1
],
"Dama:PALOMA PICASSO|PALOMA PICASSO": [
"Floral, Oriental",
"Aldehídos, bergamota, limón",
"Rosa, jazmín, ylang-ylang",
"Pachulí, musgo de roble, ámbar",
3,
"n"
],
"Dama:PARFUMS DE MARLY|DELINA EXCLUSIF": [
"Floral, Dulce",
"",
"",
"",
3,
"b",
1
],
"Dama:PARFUMS DE MARLY|DELINA LIMITED EDITION": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARFUMS DE MARLY|PALATINE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|CAN CAN": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|CANCAN BURLESQUE": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|DAZZLE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|ELECTRIFY": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|FAIRY DUST": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|HEIRESS": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|JUST ME FOR WOMAN": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|PARIS HILTON LTD EDITION ANNIVERSARY": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|PARIS HILTON WOMAN": [
"Floral, Dulce",
"Manzana, durazno, melón",
"Jazmín, mimosa, lirio",
"Sándalo, almizcle, ylang-ylang",
2,
"b",
1
],
"Dama:PARIS HILTON|PASSPORT": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|ROS� RUSH": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PARIS HILTON|SIREN": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PEPE JEANS|PEPE JEANS FOR HER": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:PERRY ELLIS|18 WOMAN": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PERRY ELLIS|360 BLUE": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:PERRY ELLIS|360 CORAL": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:PERRY ELLIS|360 RED": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PERRY ELLIS|PERRY ELLIS WOMAN": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PERRY ELLIS|RESERVE": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:PHLUR|STRAWBERRY LETTER": [
"Dulce",
"Fresa",
"Flores",
"Almizcle, vainilla",
2,
"b",
1
],
"Dama:PITBULL|CUBA WOMAN": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PITBULL|MIAMI WOMAN": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PITBULL|PITBULL WOMAN": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:PRADA|CANDY": [
"Dulce, Oriental",
"Caramelo",
"Almizcle, benjuí",
"Vainilla, ámbar",
3,
"n"
],
"Dama:PRADA|CANDY SUGAR POP": [
"Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:PUMA|PUMA URBAN MOTION WOMAN": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:RALPH LAUREN|BIG PONY 1": [
"Fresca, Floral",
"Cítricos, frutas",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:RALPH LAUREN|BIG PONY 2": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:RALPH LAUREN|POLO SPORT WOMAN": [
"Fresca, Floral",
"Cítricos, notas verdes",
"Flores acuáticas",
"Almizcle",
1,
"d",
1
],
"Dama:RALPH LAUREN|RALPH COOL": [
"Fresca, Floral",
"Pera, menta, mandarina",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:RALPH LAUREN|RALPH FRESH": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:RALPH LAUREN|RALPH WILD": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:RALPH LAUREN|ROMANCE": [
"Floral",
"Rosa, jengibre",
"Rosa, violeta",
"Almizcle, pachulí",
2,
"b"
],
"Dama:RALPH LAUREN|ROMANCE ROS�": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:RALPH LAUREN|WOMAN BY RALPH LAUREN": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:RIHANNA|CRUSH": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:RIHANNA|KISS": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:RIHANNA|REB'L FLEUR": [
"Floral, Dulce",
"Frutos rojos, ciruela",
"Rosa, peonía, jazmín",
"Vainilla, almizcle, pachulí",
2,
"b",
1
],
"Dama:RIHANNA|RIRI": [
"Dulce, Floral",
"Fresa, pera",
"Rosa",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:RIHANNA|ROGUE": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Dama:ROCHAS|EAU DE ROCHAS": [
"Fresca, Floral",
"Bergamota, limón, mandarina",
"Jazmín, rosa, narciso",
"Almizcle, musgo de roble, sándalo",
1,
"d"
],
"Dama:ROCHAS|GIRL": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:ROCHAS|MADAME ROCHAS": [
"Floral",
"Aldehídos, neroli",
"Rosa, jazmín",
"Sándalo, almizcle",
2,
"b",
1
],
"Dama:ROCHAS|MADEMOISELLE ROCHAS": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SABRINA CARPENTER|SWEET TOOTH": [
"Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SALVATORE FERRAGAMO|SIGNORINA": [
"Floral, Dulce",
"Grosella roja, pimienta rosa",
"Jazmín, rosa, panna cotta",
"Pachulí, almizcle",
2,
"b"
],
"Dama:SALVATORE FERRAGAMO|SIGNORINA LIBERA": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SAMBA|SAMBA": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:SARAH JESSICA PARKER|SJP NYC": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SELENA GOMEZ|VIVAMORE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SHAKIRA|DANCE MIDNIGHT": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:SHAKIRA|LOVE ROCK!": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SHAKIRA|PARADISE ELIXIR": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:SHAKIRA|POP ROCK": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SHAKIRA|ROCK!": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SHAKIRA|S BLUSH KISS": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SHAKIRA|S BY SHAKIRA": [
"Floral, Dulce",
"Frutas, mandarina",
"Jazmín, rosa",
"Vainilla, almizcle",
2,
"b",
1
],
"Dama:SHAKIRA|S KISS": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SOFIA VERGARA|LOVE.": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:SWISS ARMY|SWISS ARMY FOR HER": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:THE BODY SHOP|CASSIS ROSE": [
"Floral, Dulce",
"Grosella negra",
"Rosa",
"Almizcle",
1,
"d",
1
],
"Dama:TIFFANY & CO|TIFFANY": [
"Floral, Amaderada",
"Mandarina, grosella",
"Iris",
"Almizcle, maderas",
2,
"b"
],
"Dama:TOM FORD|BLACK ORCHID": [
"Oriental, Floral",
"Trufa, gardenia, grosella negra",
"Orquídea negra, especias",
"Pachulí, vainilla, incienso, chocolate",
3,
"n"
],
"Dama:TOM FORD|BLACK ORCHID VOILE DE FLEUR": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:TOM FORD|DCAFE ROSE 2023": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:TOM FORD|JASMIN ROUGE": [
"Floral, Oriental",
"Mandarina, especias",
"Jazmín, clavo",
"Vainilla, ámbar",
3,
"n",
1
],
"Dama:TOM FORD|NOIR": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Dama:TOM FORD|WHITE SUEDE": [
"Floral, Amaderada",
"Té, almizcle",
"Rosa, lirio",
"Gamuza, sándalo",
2,
"b"
],
"Dama:TOMMY HILFIGER|HILFIGER WOMAN CANDIED CHARMS": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:TOMMY HILFIGER|TOMMY 10 GIRL": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:TOMMY HILFIGER|TOMMY GIRL": [
"Floral, Fresca",
"Manzana, grosella, mandarina",
"Magnolia, rosa, madreselva",
"Sándalo, cedro",
1,
"d"
],
"Dama:TOMMY HILFIGER|TRUE STAR": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:TOUS|H2O": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:TOUS|LOVEME ONYX": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:TOUS|LOVEME THE EMERALD ELIXIR": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:TOUS|MORE MORE PINK": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:TOUS|NEON CANDY": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:TOUS|OH! THE ORIGIN": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:TOUS|TOUS EDT": [
"Floral, Fresca",
"Bergamota, frambuesa",
"Rosa, peonía",
"Almizcle, vainilla",
1,
"d",
1
],
"Dama:TOUS|YOUR POWERS": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VALENTINO|VALENTINA": [
"Floral, Dulce",
"Bergamota, trufa, fresa silvestre",
"Jazmín, tuberosa, flor de naranjo",
"Vainilla, cedro",
2,
"b"
],
"Dama:VALENTINO|VOCE VIVA": [
"Floral, Dulce",
"Mandarina, bergamota",
"Gardenia, flor de naranjo",
"Vainilla, almizcle",
2,
"b"
],
"Dama:VERSACE|BRIGHT CRYSTAL ABSOLU": [
"Floral, Oriental",
"",
"",
"",
2,
"b",
1
],
"Dama:VERSACE|CRYSTAL NOIR": [
"Oriental, Floral",
"Pimienta, coco, jengibre",
"Gardenia, peonía, orquídea",
"Sándalo, ámbar, almizcle",
3,
"n"
],
"Dama:VERSACE|DYLAN BLUE": [
"Floral, Fresca",
"Grosella, manzana, trébol",
"Rosa, durazno, jazmín",
"Almizcle, pachulí, styrax",
2,
"d"
],
"Dama:VERSACE|DYLAN TURQUOISE": [
"Fresca, Floral",
"Mandarina, grosella rosada",
"Jazmín, rosa",
"Almizcle, ambroxan",
1,
"d"
],
"Dama:VERSACE|VANITAS": [
"Floral, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Dama:VERSACE|VERSACE": [
"Floral, Oriental",
"",
"",
"",
2,
"b",
1
],
"Dama:VERSACE|VERSENSE": [
"Fresca, Floral",
"Bergamota, mandarina",
"Jazmín, cactus",
"Sándalo, almizcle",
1,
"d",
1
],
"Dama:VERSACE|YELLOW DIAMOND": [
"Floral, Fresca",
"Pera, limón, bergamota",
"Mimosa, flor de naranjo",
"Almizcle, ámbar, maderas",
1,
"d"
],
"Dama:VICTORIA'S SECRET|AQUA KISS": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|BARE": [
"Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|BOMBSHELL": [
"Floral, Dulce",
"Maracuyá, toronja, fresa",
"Peonía, orquídea",
"Vainilla, almizcle",
2,
"b"
],
"Dama:VICTORIA'S SECRET|BOMBSHELL GLAMOUR": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|BOMBSHELL NIGHTS": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Dama:VICTORIA'S SECRET|BOMBSHELL OUD": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Dama:VICTORIA'S SECRET|BOMBSHELL SUNDRENCHED": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|BOMBSHELLS IN BLOOM": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|COCONUT PASION": [
"Dulce, Fresca",
"Coco",
"Flores tropicales",
"Vainilla, almizcle",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|CRUSH.": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|DARK ANGEL": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Dama:VICTORIA'S SECRET|DREAM ANGELS EDP 2019": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|EAU SO PARTY": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|EAU SO SEXY": [
"Floral",
"",
"",
"",
2,
"n",
1
],
"Dama:VICTORIA'S SECRET|ENDLESS LOVE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|HELLO DARLING": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|LIFE IS PINK HOPE PINK": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|LIFE IS PINK LIVE PINK": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|LIFE IS PINK WISH PINK": [
"Floral, Dulce",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|LOVE EAU DE PARFUM": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|LOVE ME": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|MANGO TEMPTATION": [
"Dulce, Fresca",
"Mango",
"Flores",
"Vainilla",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|PEACH SQUEEZE": [
"Dulce, Fresca",
"Durazno",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|PINK ALL MY HEART": [
"Dulce, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA�S SECRET|PINK BY PINK": [
"Dulce, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|PINK SUN KISSED": [
"Dulce, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|PINK SWEET & FLIRTY": [
"Dulce, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|PINK WILD & BREEZY": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:VICTORIA'S SECRET|SCANDALOUS": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:VICTORIA'S SECRET|SECRET ANGEL": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|TEASE COCOA SOIR�E": [
"Dulce, Oriental",
"Cacao",
"Flores",
"Vainilla, almizcle",
2,
"n",
1
],
"Dama:VICTORIA'S SECRET|TEASE FLOWER": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:VICTORIA'S SECRET|VAINILLA LACE": [
"Dulce, Floral",
"Vainilla",
"Flores",
"Almizcle",
1,
"b",
1
],
"Dama:VICTORIA'S SECRET|VICTORIA'S SECRET XO": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:VIKTOR & ROLF|BONBON": [
"Dulce",
"Mandarina, durazno, naranja",
"Caramelo, flor de naranjo, jazmín",
"Ámbar, cedro, vetiver",
3,
"b"
],
"Dama:VIKTOR & ROLF|BONBON COUTURE": [
"Dulce, Floral",
"",
"",
"",
3,
"n",
1
],
"Dama:VIKTOR & ROLF|FLOWERBOMB MIDNIGHT": [
"Floral, Dulce",
"Grosella negra, pimienta rosa",
"Orquídea, rosa, jazmín",
"Pachulí, almizcle, vainilla",
3,
"n"
],
"Dama:VIKTOR & ROLF|GOOD FORTUNE": [
"Floral, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Dama:YANBAL|CELOS": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Dama:YANBAL|CIELO": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:YANBAL|CORI PASION": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:YANBAL|GAIA": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Dama:YANBAL|OSADIA": [
"Oriental, Floral",
"",
"",
"",
2,
"n",
1
],
"Dama:YVES SAINT LAURENT|BLACK OPIUM LE PARFUM": [
"Dulce, Oriental",
"Café, vainilla",
"Flor de naranjo",
"Vainilla, pachulí",
3,
"n",
1
],
"Dama:YVES SAINT LAURENT|BLACK OPIUM OVER RED": [
"Dulce, Oriental",
"Cereza, café",
"Jazmín",
"Vainilla, pachulí",
3,
"n",
1
],
"Dama:YVES SAINT LAURENT|CHAMPAGNE": [
"Floral, Fresca",
"Durazno, nectarina, bergamota",
"Rosa, lila, lichi",
"Almizcle, vetiver, musgo de roble",
2,
"b"
],
"Dama:YVES SAINT LAURENT|IN LOVE AGAIN": [
"Floral, Fresca",
"Grosella negra, frambuesa, toronja",
"Jazmín, rosa",
"Almizcle, cedro",
1,
"d"
],
"Dama:YVES SAINT LAURENT|LIBRE L�ABSOLU PLATINE": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:YVES SAINT LAURENT|LIBRE LE PARFUM": [
"Floral, Oriental",
"Lavanda, mandarina, jengibre",
"Flor de naranjo, lavanda",
"Vainilla, ámbar, cedro",
3,
"n"
],
"Dama:YVES SAINT LAURENT|MON PARIS COUTURE": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:YVES SAINT LAURENT|MON PARIS LUMIERE": [
"Dulce, Floral",
"",
"",
"",
2,
"b",
1
],
"Dama:YVES SAINT LAURENT|OPIUM": [
"Oriental",
"Mandarina, clavo, pimienta",
"Jazmín, rosa, clavel",
"Pachulí, mirra, vainilla, incienso",
3,
"n"
],
"Dama:YVES SAINT LAURENT|PARIS": [
"Floral",
"Rosa, violeta, mimosa",
"Rosa, iris, lirio",
"Sándalo, almizcle, ámbar",
2,
"b"
],
"Dama:YVES SAINT LAURENT|PARISIENNE": [
"Floral, Amaderada",
"Mora, rosa",
"Peonía, violeta",
"Almizcle, vetiver, sándalo",
2,
"b"
],
"Dama:ZARA|HIP HOP RED APPLE": [
"Fresca, Dulce",
"Manzana roja",
"Flores",
"Almizcle",
1,
"d",
1
],
"Dama:ZARA|ROSE MARSHMALLOW CANDY": [
"Dulce, Floral",
"Rosa",
"Malvavisco",
"Vainilla, almizcle",
2,
"b",
1
],
"Unisex:ACQUA DI PARMA|ACQUA DI PARMA BLU MEDITERRANEO": [
"Fresca, Aromática",
"Bergamota, limón, mandarina",
"Romero, enebro, cardamomo",
"Cedro, almizcle",
1,
"d",
1
],
"Unisex:ACQUA DI PARMA|OUD EAU DE PARFUM": [
"Amaderada, Oriental",
"Bergamota, cardamomo",
"Oud, sándalo",
"Pachulí, vetiver",
3,
"n"
],
"Unisex:AL HARAMAIN|AMBER OUD GOLD EDITION": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Unisex:AMOUAGE|GUIDANCE": [
"Oriental, Floral",
"Pera, avellana",
"Osmanto, rosa",
"Sándalo, incienso, vainilla",
3,
"n"
],
"Unisex:ARMAF|CLUB DE NUIT OUD PARFUM 2": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Unisex:ARMANI|SANTAL DAN SHA": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Unisex:BDK PARFUM|GRIS CHARNEL EXTRAIT": [
"Amaderada, Oriental",
"Pimienta, cardamomo",
"Lavanda",
"Vetiver, haba tonka, almizcle",
2,
"b",
1
],
"Unisex:BILLIE EILISH|EILISH N 3": [
"Oriental, Dulce",
"",
"",
"",
2,
"b",
1
],
"Unisex:BOND NO 9|DUBAI GOLD": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Unisex:BOND NO 9|NEW YORK PACHOULI": [
"Amaderada, Oriental",
"Bergamota",
"Pachulí",
"Vainilla, haba tonka",
3,
"n",
1
],
"Unisex:BVLGARI|ALLEGRA MAGNIFYING NEROLI": [
"Fresca, Floral",
"Neroli, bergamota",
"Flor de naranjo",
"Almizcle",
1,
"d",
1
],
"Unisex:BY KILIAN|ANGEL'S SHARE": [
"Dulce, Oriental",
"Coñac",
"Canela, haba tonka, praliné",
"Vainilla, sándalo",
3,
"n"
],
"Unisex:BY KILIAN|BLACK PHANTOM": [
"Dulce, Oriental",
"Ron, café",
"Caramelo, cacao",
"Vainilla, sándalo",
3,
"n"
],
"Unisex:BY KILIAN|IMPERIAL TEA 2024": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Unisex:BY KILIAN|PRINCESS EAU FRAICHE": [
"Dulce, Fresca",
"",
"",
"",
2,
"d",
1
],
"Unisex:BY KILIAN|SMOKING HOT": [
"Oriental, Dulce",
"Bergamota",
"Tabaco, especias",
"Vainilla, maderas",
3,
"n",
1
],
"Unisex:CALVIN KLEIN|CK ALL": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK EVERYONE": [
"Fresca",
"Naranja, té",
"Notas verdes",
"Cedro, almizcle",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK EVERYONE EAU DE PARFUM": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK ONE COLECTOR": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK ONE GOLD": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK ONE PLATINUM EDITION": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK ONE REFLECTIONS": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK ONE SUMMER 2015": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK ONE SUMMER 2022 DAZE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK1 PALACE": [
"Fresca, Floral",
"",
"",
"",
1,
"d",
1
],
"Unisex:CALVIN KLEIN|CK2": [
"Aromática, Amaderada",
"",
"",
"",
1,
"d",
1
],
"Unisex:CAROLINA HERRERA|MYSTERY TOBACCO": [
"Oriental, Dulce",
"Especias",
"Tabaco",
"Vainilla, maderas",
3,
"n",
1
],
"Unisex:CARTIER|INSOUCIANCE": [
"Floral, Fresca",
"",
"",
"",
1,
"d",
1
],
"Unisex:CHANEL|PARIS BIARRITZ": [
"Fresca, Floral",
"Limón, mandarina, notas verdes",
"Lirio de los valles",
"Almizcle, cedro",
1,
"d",
1
],
"Unisex:CHANEL|SYCOMORE": [
"Amaderada",
"Aldehídos",
"Vetiver, sándalo",
"Cedro, almizcle",
2,
"b",
1
],
"Unisex:CREED|CENTAURUS": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Unisex:CREED|MILLESIME IMPERIAL": [
"Fresca, Dulce",
"Melón, limón, bergamota, sal marina",
"Iris, notas marinas",
"Almizcle, sándalo, ámbar",
2,
"d"
],
"Unisex:CREED|ORIGINAL SANTAL": [
"Oriental, Amaderada",
"Canela, cilantro",
"Sándalo, lavanda",
"Haba tonka, vainilla",
2,
"b",
1
],
"Unisex:CREED|SILVER MOUNTAIN WATER": [
"Fresca",
"Bergamota, mandarina",
"Té verde, grosella negra",
"Almizcle, sándalo, gálbano",
1,
"d"
],
"Unisex:CREED|WHITE AMBER": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Unisex:DIESEL|D BY DIESEL": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Unisex:DIOR|DIORIVIERA": [
"Fresca, Floral",
"Bergamota",
"Rosa, higo",
"Almizcle, maderas",
1,
"d",
1
],
"Unisex:DOLCE & GABBANA|DGVIB3 EAU DE PARFUM": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Unisex:GUERLAIN|AQUA ALLEGORIA MANDARINE BASILIC 1": [
"Fresca, Aromática",
"Mandarina, naranja amarga",
"Albahaca, té verde",
"Almizcle, maderas",
1,
"d"
],
"Unisex:GUERLAIN|AQUA ALLEGORIA MANDARINE BASILIC 2": [
"Fresca, Aromática",
"Mandarina, naranja amarga",
"Albahaca, té verde",
"Almizcle, maderas",
1,
"d"
],
"Unisex:GUERLAIN|CHERRY OUD": [
"Dulce, Oriental",
"Cereza",
"Rosa",
"Oud, vainilla, maderas",
3,
"n",
1
],
"Unisex:GUERLAIN|SANTAL PAO ROSA": [
"Amaderada",
"Iris",
"Rosa",
"Sándalo, almizcle",
2,
"b",
1
],
"Unisex:GUERLAIN|TOBACCO HONEY": [
"Oriental, Dulce",
"Miel",
"Tabaco",
"Vainilla, ámbar",
3,
"n",
1
],
"Unisex:HERMES|BASE PIPA AMBRA NICHE": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Unisex:HERMES|L'OMBRE DES MERVEILLES": [
"Amaderada, Oriental",
"Incienso",
"Ámbar",
"Maderas",
2,
"b",
1
],
"Unisex:HERMES|UN JARDIN SUR LE NIL": [
"Fresca, Floral",
"Mango verde, toronja",
"Loto, junco",
"Incienso, sicómoro",
1,
"d"
],
"Unisex:HUGO BOSS|PASSIONATE CHYPRE": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Unisex:JO MALONE|SCARLET POPPY INTENSE": [
"Floral, Oriental",
"Amapola",
"Cebada",
"Benjuí, almizcle",
2,
"b",
1
],
"Unisex:JOE MALON LONDON|WOOD SAGE & SEA SALT": [
"Fresca, Aromática",
"Ambrette",
"Sal marina, salvia",
"Algas, maderas",
1,
"d"
],
"Unisex:JO MALONE LONDON|RED HIBISCUS": [
"Floral, Fresca",
"Hibisco rojo",
"Flores",
"Almizcle",
1,
"d",
1
],
"Unisex:KAYALI|LOVEFEST BURNING CHERRY": [
"Dulce, Oriental",
"Cereza",
"Licor, especias",
"Vainilla, maderas",
3,
"n",
1
],
"Unisex:KAYALI|OUDGASM CAF� OUD | 19 EAU DE PARFUM INTENSE": [
"Oriental, Dulce",
"Café",
"Oud",
"Vainilla, ámbar",
3,
"n",
1
],
"Unisex:KAYALI|OUDGASM ROSE OUD 16 EAU DE PARFUM INTENSE": [
"Oriental, Floral",
"Rosa",
"Oud",
"Ámbar, almizcle",
3,
"n",
1
],
"Unisex:KAYALI|OUDGASM TOBACCO OUD | 04 EAU DE PARFUM INTENSE": [
"Oriental, Dulce",
"Tabaco",
"Oud",
"Vainilla, ámbar",
3,
"n",
1
],
"Unisex:KAYALI|OUDGASM VANILLA OUD": [
"Oriental, Dulce",
"Vainilla",
"Oud",
"Ámbar, almizcle",
3,
"n",
1
],
"Unisex:KAYALI|VAINILLA ROYALE SUGARED PATCHOULI |64": [
"Dulce, Oriental",
"Vainilla",
"Azúcar, pachulí",
"Ámbar",
3,
"n",
1
],
"Unisex:KILIAN|BORN TO BE UNFORGETTABLE": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Unisex:LATTAFA|AJWAD": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Unisex:LATTAFA|BADE'E AL OUD AMETHYST": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Unisex:LATTAFA|BADE�E AL OUD HONOR & GLORY": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Unisex:LATTAFA|BADE�E AL OUD OUD FOR GLORY": [
"Oriental, Amaderada",
"Azafrán",
"Oud",
"Pachulí, ámbar",
3,
"n",
1
],
"Unisex:LATAFFA|EJAZZI": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Unisex:LATTAFA|ISHQ AL SHUYUKH GOLD": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Unisex:LATTAFA|KHAMRAH": [
"Dulce, Oriental",
"Canela, nuez moscada, bergamota",
"Dátil, praliné, nardo",
"Vainilla, haba tonka, benjuí, mirra",
3,
"n"
],
"Unisex:LATTAFA|KHAMRAH EDP": [
"Dulce, Oriental",
"Canela, nuez moscada, bergamota",
"Dátil, praliné, nardo",
"Vainilla, haba tonka, benjuí",
3,
"n"
],
"Unisex:LATTAFA|KHAMRAH QAHWA": [
"Dulce, Oriental",
"Café, cardamomo, canela",
"Praliné, flores blancas",
"Vainilla, haba tonka, benjuí",
3,
"n"
],
"Unisex:LATTAFA|OUD SALAMA": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Unisex:LATTAFA|TERIAQ": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Unisex:LE LABO|BERGAMOTE 22": [
"Fresca",
"Bergamota, toronja",
"Flor de naranjo, petitgrain",
"Ámbar, almizcle, vetiver",
1,
"d"
],
"Unisex:LE LABO|LAVANDE 31": [
"Aromática",
"Lavanda, bergamota",
"Lavanda",
"Almizcle, cedro",
1,
"d",
1
],
"Unisex:LE LABO|MYRRHE 55": [
"Oriental, Amaderada",
"Mirra",
"Incienso",
"Maderas",
2,
"n",
1
],
"Unisex:LOEWE|PAULA�S IBIZA": [
"Fresca, Dulce",
"",
"",
"",
1,
"d",
1
],
"Unisex:LOEWE|PAULA�S IBIZA ELECTRIC": [
"Fresca, Dulce",
"",
"",
"",
1,
"d",
1
],
"Unisex:LOUIS VUITTON|CITY OF STARS": [
"Fresca",
"Limón, mandarina, naranja sanguina",
"Flor de tiaré",
"Almizcle, sándalo",
1,
"d"
],
"Unisex:LOUIS VUITTON|OMBRE NOMADE": [
"Oriental, Amaderada",
"Frambuesa, incienso",
"Rosa, geranio",
"Oud, benjuí",
3,
"n"
],
"Unisex:LOUIS VUITTON|ON THE BEACH": [
"Fresca",
"Toronja, yuzu",
"Pimienta rosa, neroli",
"Almizcle, maderas",
1,
"d",
1
],
"Unisex:LOUIS VUITTON|PACIFIC CHILL": [
"Fresca, Aromática",
"Menta, limón",
"Notas verdes",
"Almizcle",
1,
"d",
1
],
"Unisex:MAISON FRANCIS KURKDJIAN|AQUA MEDIA COLOGNE FORTE": [
"Fresca, Floral",
"Limón, bergamota",
"Rosa, lirio",
"Almizcle",
1,
"d",
1
],
"Unisex:MAISON FRANCIS KURKDJIAN|BACCARAT ROUGE 540 EXTRAIT DE PARFUM": [
"Dulce, Amaderada",
"Almendra amarga, azafrán",
"Jazmín, rosa",
"Ámbar, almizcle, maderas",
3,
"b"
],
"Unisex:MAISON MARTIN MARGIELA|GENTLE FLUIDITY GOLD": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Unisex:MAISON MARTIN MARGIELA|AUTUMN VIBES": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Unisex:MAISON MARTIN MARGIELA|BUBBLE BATH": [
"Floral, Fresca",
"Pimienta rosa, bergamota",
"Lavanda, jazmín, rosa",
"Almizcle blanco, pachulí",
1,
"d"
],
"Unisex:MAISON MARTIN MARGIELA|BY THE FIREPLACE": [
"Amaderada, Dulce",
"Pimienta rosa, flor de naranjo",
"Castaña, guayaco",
"Vainilla, cachemira",
3,
"n"
],
"Unisex:MAISON MARTIN MARGIELA|COFFE BREAK": [
"Dulce, Oriental",
"Café, lavanda",
"Leche, cardamomo",
"Vainilla, almizcle",
2,
"b"
],
"Unisex:MAISON MARTIN MARGELIA|COFFEE BREAK": [
"Dulce, Oriental",
"Café, lavanda",
"Leche, cardamomo",
"Vainilla, almizcle",
2,
"b"
],
"Unisex:MAISON MARTIN MARGIELA|MATCHA MEDITACION": [
"Aromática, Amaderada",
"Té matcha",
"Notas verdes",
"Maderas",
1,
"d",
1
],
"Unisex:MAISON MARTIN MARGIELA|ON A DATE": [
"Dulce, Floral",
"",
"",
"",
2,
"n",
1
],
"Unisex:MARGIELA|UNDER THE STARS": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Unisex:MANCERA|BLACK NOIR": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Unisex:MANCERA|VELVET VAINILLA": [
"Dulce",
"Vainilla",
"Flores",
"Almizcle, sándalo",
3,
"b",
1
],
"Unisex:PARFUMS DE MARLY|LAYTON EXCLUSIF": [
"Aromática, Dulce",
"Manzana, lavanda, bergamota",
"Geranio, violeta, jazmín",
"Vainilla, cardamomo, pimienta",
3,
"n"
],
"Unisex:MONTALE|CHOCOLAT GREEDY": [
"Dulce, Oriental",
"Cacao",
"Chocolate, café",
"Vainilla, haba tonka",
3,
"n",
1
],
"Unisex:MONTALE|DAY DREAMS": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Unisex:MONTALE|INTENSE CAF�": [
"Dulce, Oriental",
"Café",
"Rosa",
"Vainilla, almizcle",
3,
"n",
1
],
"Unisex:ORIENTICA PREMIUM|AMBER NOIR": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Unisex:PACO RABANNE|MAJOR ME": [
"Floral, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Unisex:ROSENDO MATEU|ROSENDO MATEU N� 8 FRUITY, AMBER, EXOTIC MUSK": [
"Dulce, Oriental",
"Frutas",
"Ámbar",
"Almizcle exótico",
2,
"b",
1
],
"Unisex:SERGE LUTENS|POIVRE NOIR": [
"Oriental, Amaderada",
"Pimienta",
"Especias",
"Maderas",
2,
"n",
1
],
"Unisex:SNIF|VANILLA VECE": [
"Dulce",
"Vainilla",
"Flores",
"Almizcle",
2,
"b",
1
],
"Unisex:THE FRUIT COMPANY|SORBET MANGO": [
"Dulce, Fresca",
"Mango",
"Flores",
"Almizcle",
1,
"d",
1
],
"Unisex:TOM FORD|BITTER PEACH": [
"Dulce, Fresca",
"Durazno, naranja sanguina",
"Rosa, jazmín",
"Vainilla, pachulí, ron",
3,
"n"
],
"Unisex:TOM FORD|BOIS MAROCAIN": [
"Amaderada, Oriental",
"",
"",
"",
3,
"n",
1
],
"Unisex:TOM FORD|COSTA AZZURA 2021": [
"Fresca, Amaderada",
"",
"",
"",
2,
"d",
1
],
"Unisex:TOM FORD|ELECTRIC CHERRY": [
"Dulce, Floral",
"Cereza",
"Jazmín",
"Almizcle, ambreta",
2,
"b",
1
],
"Unisex:TOM FORD|FUCKING FABULOUS": [
"Oriental, Aromática",
"Lavanda, salvia",
"Haba tonka, vainilla",
"Cuero, cachemira",
3,
"n"
],
"Unisex:TOM FORD|MANDARINO DI AMALFI": [
"Fresca, Aromática",
"Limón, mandarina, albahaca",
"Menta, estragón",
"Vetiver, musgo",
1,
"d"
],
"Unisex:TOM FORD|MYRRHE MYSTERE": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Unisex:TOM FORD|NOIR DE NOIR": [
"Oriental, Floral",
"",
"",
"",
3,
"n",
1
],
"Unisex:TOM FORD|OUD MINERALE": [
"Fresca, Amaderada",
"",
"",
"",
2,
"d",
1
],
"Unisex:TOM FORD|ROSE DE CHINE": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Unisex:TOM FORD|ROSE PRICK": [
"Floral, Oriental",
"Pimienta rosa",
"Rosa, especias",
"Pachulí, sándalo",
3,
"n",
1
],
"Unisex:TOM FORD|TOBACCO OUD": [
"Oriental, Amaderada",
"Tabaco",
"Oud, especias",
"Maderas, ámbar",
3,
"n",
1
],
"Unisex:TOM FORD|TUSCAN LEATHER": [
"Amaderada, Oriental",
"Frambuesa, azafrán, tomillo",
"Olíbano, jazmín",
"Cuero, gamuza, ámbar",
3,
"n"
],
"Unisex:TOUS|LOVEME": [
"Floral",
"",
"",
"",
2,
"b",
1
],
"Unisex:XERJOFF|ACCENTO": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Unisex:YVES SAINT LAURENT|CUIR 2023": [
"Amaderada, Oriental",
"",
"",
"",
3,
"n",
1
],
"Unisex:YVES SAINT LAURENT|ROUGE VELOURS": [
"Floral, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:ABERCROMBIE & FITCH|AUTHENTIC MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:ABERCROMBIE & FITCH|FIERCE": [
"Fresca, Aromática",
"Limón, cardamomo, naranja",
"Jazmín, romero, abeto",
"Almizcle, vetiver, sándalo",
2,
"b"
],
"Caballero:ABERCROMBIE & FITCH|FIRST INSTINCT": [
"Fresca, Amaderada",
"Absenta, mandarina",
"Pimienta, jazmín",
"Ámbar, gamuza",
2,
"b",
1
],
"Caballero:ACQUA DI PARMA|ESSENZA DI COLONIA": [
"Fresca, Aromática",
"Bergamota, limón, naranja",
"Lavanda, romero, verbena",
"Vetiver, sándalo, cedro",
1,
"d"
],
"Caballero:ADIDAS|ADIDAS": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:AFNAN|9PM": [
"Oriental, Dulce",
"Manzana, canela, lavanda",
"Flor de naranjo, lirio",
"Vainilla, haba tonka, ámbar, pachulí",
3,
"n"
],
"Caballero:ALFRED DUNHILL|DESIRE": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:AMOUAGE|INTERLUDE MAN": [
"Oriental, Amaderada",
"Pimienta, orégano, bergamota",
"Incienso, opopónaco",
"Oud, cuero, pachulí",
3,
"n"
],
"Caballero:ANIMALE|ANIMAL": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:ANIMALE|ANIMAL BLACK": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:ANIMALE|ANIMAL SEDUCTION": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:ANTONIO BANDERAS|DIAVOLO": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:ANTONIO BANDERAS|KING OF SEDUCTION": [
"Fresca, Aromática",
"Bergamota, limón, manzana",
"Notas marinas, cardamomo",
"Cedro, ámbar gris",
2,
"b"
],
"Caballero:ANTONIO BANDERAS|THE GOLDEN SECRET": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:ANTONIO BANDERAS|THE ICON": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:ANTONIO BANDERAS|THE SECRET TEMPTATION": [
"Oriental, Dulce",
"",
"",
"",
2,
"n",
1
],
"Caballero:ANTONIO PUIG|AGUA BRAVA": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:ANTONIO PUIG|QUORUM": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:ARAMIS|ARAMIS": [
"Amaderada, Aromática",
"Artemisa, aldehídos, bergamota",
"Cuero, pachulí, vetiver",
"Musgo de roble, ámbar, almizcle",
3,
"n"
],
"Caballero:ARAMIS|IMPECCABLE ARAMIS": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:ARMANI|ACQUA DI GIO EAU DE PARFUM": [
"Fresca, Aromática",
"Bergamota, notas marinas",
"Salvia, romero",
"Vetiver, pachulí",
2,
"b"
],
"Caballero:ARMANI|ACQUA DI GIO ESSENZA": [
"Fresca, Amaderada",
"Bergamota, mandarina",
"Pimienta, ambreta",
"Vetiver, ámbar gris",
2,
"d",
1
],
"Caballero:ARMANI|AQUA DI GIO PROFUMO": [
"Fresca, Aromática",
"Bergamota, notas marinas",
"Romero, salvia, geranio",
"Incienso, pachulí",
2,
"b"
],
"Caballero:ARMANI|ARMANI CODE": [
"Oriental, Amaderada",
"Bergamota, limón",
"Anís estrellado, flor de olivo",
"Haba tonka, cuero, tabaco",
2,
"n"
],
"Caballero:ARMANI|ARMANI CODE ABSOLU": [
"Oriental, Dulce",
"Manzana, mandarina, bergamota",
"Nuez moscada, flor de naranjo",
"Haba tonka, gamuza, vainilla",
3,
"n"
],
"Caballero:ARMANI|ARMANI CODE ABSOLU GOLD": [
"Oriental, Dulce",
"Manzana, mandarina",
"Nuez moscada",
"Haba tonka, vainilla",
3,
"n",
1
],
"Caballero:ARMANI|ARMANI CODE COLONIA": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:ARMANI|ARMANI CODE PARFUM": [
"Oriental, Dulce",
"Cardamomo, bergamota",
"Iris, lavanda",
"Haba tonka, cedro",
3,
"n"
],
"Caballero:ARMANI|ARMANI CODE PROFUMO": [
"Oriental, Dulce",
"Manzana verde, bergamota",
"Lavanda, salvia",
"Haba tonka, ámbar, vainilla",
3,
"n"
],
"Caballero:ARMANI|ARMANI CODE SPORT": [
"Fresca, Aromática",
"Limón, mandarina, menta",
"Notas acuáticas",
"Vetiver, almizcle",
1,
"d",
1
],
"Caballero:ARMANI|ARMANI MANIA": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:ARMANI|ATTITUDE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:ARMANI|DIAMONDS MAN": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Caballero:ARMANI|EAU DE NUIT": [
"Amaderada, Aromática",
"",
"",
"",
2,
"n",
1
],
"Caballero:ARMANI|EMPORIO ARMANI": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:ARMANI|STRONGER WITH YOU": [
"Oriental, Dulce",
"Pimienta rosa, cardamomo, mandarina",
"Salvia, canela, lavanda",
"Vainilla, castaña, gamuza",
3,
"n"
],
"Caballero:ARMANI|STRONGER WITH YOU AMBER": [
"Oriental, Dulce",
"Ámbar, lavanda",
"Vainilla",
"Ámbar, maderas",
3,
"n",
1
],
"Caballero:ARMANI|STRONGER WITH YOU OUD": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:AXE|APOLLO": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:AXE|COLLISION": [
"Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:AXE|DARK TEMPTATION": [
"Dulce, Oriental",
"Pimienta roja",
"Chocolate",
"Ámbar, maderas",
2,
"n",
1
],
"Caballero:AXE|GOLD TEMPTATION": [
"Dulce, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:AZZARO|AZZARO": [
"Aromática, Amaderada",
"Anís, lavanda, albahaca",
"Vetiver, enebro, pachulí",
"Haba tonka, musgo de roble, ámbar",
2,
"b"
],
"Caballero:AZZARO|WANTED BY NIGHT": [
"Oriental, Amaderada",
"Canela, mandarina, pimienta",
"Tabaco, cedro",
"Benjuí, ládano",
3,
"n"
],
"Caballero:BENETTON|COLORS MAN BLACK": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:BENETTON|COLORS UOMO": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:BENETTON|UNITED DREAM TOGETHER": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:BENETTON|UNITED DREAMS GREEN CACTUS FOR HIM": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:BENETTON|WE ARE TRIBE": [
"Fresca, Amaderada",
"",
"",
"",
1,
"d",
1
],
"Caballero:BHARARA|KING": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Caballero:BOND NO 9|CHEZ BOND 9": [
"Fresca, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:BURBERRY|BRIT BURBERRY": [
"Oriental, Amaderada",
"Jengibre, mandarina",
"Nuez moscada, cedro",
"Haba tonka, almizcle",
2,
"n"
],
"Caballero:BURBERRY|BURBERRY SPORT MAN": [
"Fresca, Aromática",
"Limón, jengibre",
"Notas marinas",
"Almizcle, maderas",
1,
"d",
1
],
"Caballero:BURBERRY|BURBERRY�S": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:BURBERRY|HERO": [
"Amaderada, Fresca",
"Bergamota",
"Enebro, pimienta negra",
"Cedro",
2,
"b"
],
"Caballero:BURBERRY|MR. BURBERRY": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:BVLGARI|BVL": [
"Amaderada, Fresca",
"",
"",
"",
2,
"b",
1
],
"Caballero:BVLGARI|BVLGARI": [
"Fresca, Aromática",
"Bergamota, limón",
"Té verde",
"Almizcle, maderas",
1,
"d",
1
],
"Caballero:BVLGARI|LE GEMME OROM": [
"Amaderada, Oriental",
"",
"",
"",
3,
"n",
1
],
"Caballero:BVLGARI|MAN TERRAE ESSENCE": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:CACHAREL|AMOR POUR HOMME": [
"Oriental, Dulce",
"",
"",
"",
2,
"n",
1
],
"Caballero:CALVIN KLEIN|CALVIN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CALVIN KLEIN|CK IN 2 U": [
"Fresca, Aromática",
"Bergamota, toronja, limón",
"Té, jengibre",
"Cedro, almizcle",
1,
"d",
1
],
"Caballero:CALVIN KLEIN|CK ONE RED EDITION": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:CALVIN KLEIN|CK ONE SHOCK FOR HIM": [
"Aromática, Dulce",
"Pepino, albahaca",
"Cardamomo",
"Tabaco, almizcle",
2,
"n",
1
],
"Caballero:CALVIN KLEIN|CRAVE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CALVIN KLEIN|DEFY": [
"Amaderada, Aromática",
"Bergamota, lavanda",
"Vetiver, maderas",
"Ámbar, haba tonka",
2,
"b",
1
],
"Caballero:CALVIN KLEIN|ENCOUNTER": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:CALVIN KLEIN|ESCAPE FOR MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CALVIN KLEIN|ETERNITY": [
"Aromática",
"Lavanda, mandarina, limón",
"Salvia, albahaca, jazmín",
"Sándalo, vetiver, almizcle",
1,
"d"
],
"Caballero:CALVIN KLEIN|ETERNITY AIR MEN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CALVIN KLEIN|ETERNITY AQUA": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CALVIN KLEIN|ETERNITY FLAME FOR MEN": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:CALVIN KLEIN|ETERNITY PARFUM FOR MEN": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:CALVIN KLEIN|ETERNITY SUMMER": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CALVIN KLEIN|EUPHORIA ESSENCE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:CALVIN KLEIN|OBSESSION": [
"Oriental, Amaderada",
"Lavanda, mandarina, bergamota",
"Canela, clavo",
"Ámbar, vetiver, sándalo",
3,
"n"
],
"Caballero:CARLO CORINTO|CARLO CORINTO": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:CAROLINA HERRERA|212 H20": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CAROLINA HERRERA|212 MEN AQUA": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CAROLINA HERRERA|212 ON ICE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CAROLINA HERRERA|212 SEXY MAN": [
"Oriental, Dulce",
"Bergamota, mandarina",
"Violeta, cardamomo",
"Vainilla, sándalo, gaiac",
2,
"n"
],
"Caballero:CAROLINA HERRERA|212 VIP BLACK": [
"Oriental, Dulce",
"Absenta, anís",
"Ámbar negro",
"Haba tonka, almizcle",
3,
"n"
],
"Caballero:CAROLINA HERRERA|212 VIP BLACK I LOVE NY": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|212 VIP BLACK RED": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|212 VIP BLACK SMILEY": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|212 VIP MEN CLUB EDITION": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|212 VIP WILD PARTY": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|AQUA": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CAROLINA HERRERA|BAD BOY": [
"Oriental, Amaderada",
"Pimienta negra, bergamota",
"Salvia, cedro",
"Haba tonka, cacao, ámbar",
3,
"n"
],
"Caballero:CAROLINA HERRERA|BAD BOY DAZZLING GARDEN EDT": [
"Oriental, Floral",
"",
"",
"",
2,
"b",
1
],
"Caballero:CAROLINA HERRERA|BAD BOY EXTREME": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|BAD BOY SUPERSTAR 2021": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|CH MEN": [
"Amaderada, Oriental",
"Toronja, bergamota",
"Cuero, azafrán",
"Sándalo, ámbar",
2,
"b",
1
],
"Caballero:CAROLINA HERRERA|CH MEN AFRICA": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:CAROLINA HERRERA|CH MEN BEAST": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|CH MEN CENTRAL PARK": [
"Fresca, Amaderada",
"",
"",
"",
2,
"d",
1
],
"Caballero:CAROLINA HERRERA|CH MEN HOT! HOT! HOT!": [
"Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:CAROLINA HERRERA|CH MEN KING": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:CAROLINA HERRERA|CH MEN PASSION": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:CAROLINA HERRERA|CH MEN PRIV�": [
"Amaderada, Oriental",
"Pimienta, cardamomo",
"Cuero, salvia",
"Vetiver, ámbar",
2,
"n",
1
],
"Caballero:CAROLINA HERRERA|CH MEN SPORT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CAROLINA HERRERA|HERRERA": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:CARTIER|DECLARATION": [
"Amaderada, Oriental",
"Naranja amarga, cardamomo",
"Comino, cedro",
"Vetiver, musgo de roble",
2,
"b",
1
],
"Caballero:CARTIER|PASHA": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:CARTIER|SANTOS": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:CHANEL|ALLURE HOMME": [
"Oriental, Amaderada",
"Mandarina, limón, pimienta",
"Cedro, pimienta rosa",
"Vainilla, haba tonka, almizcle",
2,
"b"
],
"Caballero:CHANEL|ANTAEUS": [
"Amaderada, Aromática",
"",
"",
"",
3,
"n",
1
],
"Caballero:CLINIQUE|HAPPY": [
"Fresca, Aromática",
"Bergamota, limón, mandarina",
"Menta, jazmín",
"Maderas, almizcle",
1,
"d",
1
],
"Caballero:COACH|COACH BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:COTY|VANILLA FIELDS": [
"Dulce, Floral",
"Vainilla",
"Flores",
"Almizcle",
2,
"b",
1
],
"Caballero:CR7|CR7 FEARLESS": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:CR7|LEGACY": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:CR7|LEGACY PRIVATE EDITION": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:CR7|PLAY IT COOL": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CREED|ABSOLU AVENTUS": [
"Fresca, Amaderada",
"Piña, grosella negra",
"Abedul, pachulí",
"Almizcle, ámbar gris",
3,
"b",
1
],
"Caballero:CREED|GREEN IRISH TWEED": [
"Aromática, Fresca",
"Limón, verbena, menta",
"Violeta, iris",
"Sándalo, ámbar gris",
2,
"d"
],
"Caballero:CREED|VIKING": [
"Fresca, Aromática",
"Bergamota, limón, pimienta rosa",
"Menta, lavanda",
"Vetiver, pachulí, sándalo",
2,
"b",
1
],
"Caballero:CREED|VIKINGA COLOGNE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:CUBA PARIS|CUBA ORANGE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:DAVID BECKHAM|URBAN HOMME": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:DAVIDOFF|COOL WATER": [
"Fresca, Aromática",
"Menta, notas marinas, lavanda",
"Jazmín, geranio, sándalo",
"Almizcle, ámbar, musgo de roble",
1,
"d"
],
"Caballero:DAVIDOFF|COOL WATER AQUAMAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:DAVIDOFF|ECHO": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:DAVIDOFF|RUN WILD": [
"Fresca, Amaderada",
"",
"",
"",
1,
"d",
1
],
"Caballero:DIESEL|BAD DIESEL": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:DIESEL|D RED BY DIESEL": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:DIESEL|DIESEL PLUS PLUS": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:DIESEL|FUEL FOR LIFE": [
"Aromática, Amaderada",
"Anís, toronja",
"Lavanda, frambuesa",
"Vetiver",
2,
"b",
1
],
"Caballero:DIESEL|ONLY THE BRAVE HIGH": [
"Fresca, Aromática",
"",
"",
"",
2,
"d",
1
],
"Caballero:DIESEL|ONLY THE BRAVE WILD": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:DIESEL|SPIRIT OF THE BRAVE INTENSE": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:DIESEL|SPIRIT ON THE BRAVE": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:DIOR|DIOR HOMME 2005": [
"Aromática, Amaderada",
"Lavanda, salvia",
"Iris, cacao",
"Vetiver, cuero",
2,
"b",
1
],
"Caballero:DIOR|DIOR HOMME 2020": [
"Amaderada",
"Bergamota",
"Cedro, iris",
"Almizcle, vetiver",
2,
"b"
],
"Caballero:DIOR|DIOR HOMME INTENSE": [
"Oriental, Amaderada",
"Lavanda",
"Iris, ambreta, pera",
"Vetiver, cedro",
3,
"n"
],
"Caballero:DIOR|DIOR HOMME SPORT 2008": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:DIOR|DIOR HOMME SPORT 2017": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:DIOR|DIOR HOMME SPORT 2021": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:DOLCE & GABBANA|DOLCE & GABBANA": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:DOLCE & GABBANA|LIGHT BLUE FOREVER": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:DOLCE & GABBANA|LIGHT BLUE INTENSE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:DOLCE & GABBANA|THE ONE": [
"Oriental, Dulce",
"Toronja, cilantro, albahaca",
"Jengibre, cardamomo, flor de naranjo",
"Tabaco, ámbar, cedro",
2,
"n"
],
"Caballero:DOLCE & GABBANA|THE ONE GOLD": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:DOLCE & GABBANA|THE ONE GREY": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:DOLCE & GABBANA|THE ONE SPORT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:DONNA KARAN|BE DELICIOUS MEN": [
"Fresca, Dulce",
"Manzana, toronja",
"Notas verdes",
"Almizcle, maderas",
1,
"d",
1
],
"Caballero:ED HARDY|ED HARDY MAN": [
"Aromática, Dulce",
"",
"",
"",
2,
"b",
1
],
"Caballero:ED HARDY|LOVE LUCK": [
"Fresca, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:EMANUEL UNGARO|UNGARO": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:EMANUEL UNGARO|UNGARO COLOGNE EXTREME": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:ENGLISH LEATHER|ENGLISH LEATHER": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:ENRIQUE IGLESIAS|ADRENALINE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:ENRIQUE IGLESIAS|ADRENALINE NIGHT": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:EON PRODUCTIONS|007 INTENSE": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:ERMENEGILDO ZEGNA|UOMO ABSOLUTE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Caballero:ERMENEGILDO ZEGNA|ZEGNA": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:FERRARI|BLACK": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:FERRARI|CEDAR ESSENCE": [
"Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:FERRARI|MAIN IN RED": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:FERRARI|RED": [
"Fresca, Amaderada",
"Manzana, ciruela",
"Canela, cardamomo",
"Cedro, almizcle",
2,
"b",
1
],
"Caballero:FERRARI|SCUDERIA FERRARI FORTE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:FERRARI|YELLOW": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:FERRIONI|ORANGE TERRIER FOR MEN": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:FREDERIC MALLE|UNCUT GEM": [
"Oriental, Amaderada",
"Incienso",
"Ámbar",
"Maderas, almizcle",
3,
"n",
1
],
"Caballero:GEOFFREY BEENE|GREY FLANNEL": [
"Aromática, Floral",
"Gálbano, bergamota, lavanda",
"Violeta, iris, salvia",
"Haba tonka, musgo de roble, vetiver",
2,
"b"
],
"Caballero:GIVENCHY|GENTLEMAN EDP RESERVE PRIV�E": [
"Oriental, Amaderada",
"Bergamota",
"Iris, especias",
"Pachulí, cuero",
3,
"n",
1
],
"Caballero:GIVENCHY|GENTLEMAN SOCIETY": [
"Floral, Amaderada",
"Salvia, cardamomo",
"Narciso, lavanda",
"Vainilla, sándalo, vetiver",
2,
"b"
],
"Caballero:GIVENCHY|GENTLEMEN ONLY": [
"Amaderada, Aromática",
"Pimienta, mandarina",
"Abedul, pimienta",
"Pachulí, vetiver",
2,
"b",
1
],
"Caballero:GIVENCHY|GENTLEMEN ONLY CASUAL CHIC": [
"Fresca, Amaderada",
"",
"",
"",
1,
"d",
1
],
"Caballero:GIVENCHY|PLAY": [
"Amaderada, Aromática",
"Mandarina, toronja, bergamota",
"Pimienta, cacao",
"Vetiver, pachulí, haba tonka",
2,
"b"
],
"Caballero:GIVENCHY|VERY IRRESISTIBLE MAN": [
"Aromática, Amaderada",
"Albahaca, menta",
"Anís estrellado",
"Vetiver, cedro",
2,
"b",
1
],
"Caballero:GUCCI|GUCCI GUILTY": [
"Oriental, Aromática",
"Limón, lavanda",
"Flor de naranjo, pimienta",
"Pachulí, cedro",
2,
"n"
],
"Caballero:GUCCI|GUCCI GUILTY BLACK": [
"Oriental, Aromática",
"Lavanda",
"Cilantro",
"Pachulí, cedro",
2,
"n",
1
],
"Caballero:GUERLAIN|HOMME INTENSE": [
"Amaderada, Floral",
"Bergamota, anís",
"Iris, cacao, haba tonka",
"Vetiver, pachulí",
2,
"n",
1
],
"Caballero:GUERLAIN|VETIVER": [
"Amaderada, Fresca",
"Limón, bergamota",
"Vetiver, pimienta",
"Tabaco, haba tonka",
2,
"d"
],
"Caballero:GUESS|GUESS": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:GUESS|GUESS MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:GUESS|GUESS NIGHT": [
"Fresca, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:GUY LAROCHE|DRAKKAR NOIR": [
"Aromática, Amaderada",
"Lavanda, limón, romero",
"Jazmín, cilantro",
"Cuero, vetiver, musgo de roble",
2,
"b"
],
"Caballero:HALLOWEEN|HALLOWEEN MAN X": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:HALSTON|Z-14": [
"Aromática, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:HERMES|H24": [
"Aromática, Fresca",
"Ruibarbo, esclarea",
"Narciso, rosa",
"Palo de rosa, maderas",
2,
"d"
],
"Caballero:HERMES|TERRES D�HERMES EAU GIVR�E": [
"Fresca, Amaderada",
"Naranja amarga, enebro",
"Pimienta",
"Cedro, vetiver",
1,
"d",
1
],
"Caballero:HOLLISTER|JAKE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|BOSS IN MOTION": [
"Amaderada, Oriental",
"Toronja, cardamomo",
"Canela, pimienta",
"Vetiver, almizcle",
2,
"b",
1
],
"Caballero:HUGO BOSS|BOSS IN MOTION WHITE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|BOSS ORANGE": [
"Amaderada, Oriental",
"Manzana",
"Incienso, especias",
"Vainilla, maderas",
2,
"b",
1
],
"Caballero:HUGO BOSS|BOSS PURE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|BOSS SELECTION": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|BOSS SPIRIT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|BOSS THE SCENT PRIVATE": [
"Oriental, Dulce",
"",
"",
"",
2,
"n",
1
],
"Caballero:HUGO BOSS|BOSS THE SCENT ELIXIR FOR HIM": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:HUGO BOSS|BOSS THE SCENT LE PARFUM": [
"Oriental, Dulce",
"Jengibre, pimienta",
"Lavanda, manzana",
"Cuero, maninka",
3,
"n",
1
],
"Caballero:HUGO BOSS|BOTTLED 98": [
"Amaderada, Fresca",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|BOTTLED ABSOLUTE": [
"Amaderada, Oriental",
"",
"",
"",
3,
"n",
1
],
"Caballero:HUGO BOSS|BOTTLED ELIXIR": [
"Amaderada, Oriental",
"Incienso, cardamomo",
"Vetiver, pachulí",
"Ládano, cedro",
3,
"n"
],
"Caballero:HUGO BOSS|BOTTLED INFINITE": [
"Fresca, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|BOTTLED INTENSE": [
"Amaderada, Dulce",
"Manzana, canela",
"Clavo, nuez moscada",
"Vainilla, sándalo",
3,
"n",
1
],
"Caballero:HUGO BOSS|BOTTLED MARINE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|BOTTLED NIGHT": [
"Amaderada",
"Cardamomo, lavanda",
"Abedul",
"Maderas, almizcle",
2,
"n"
],
"Caballero:HUGO BOSS|BOTTLED SPORT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|BOTTLED TONIC": [
"Fresca, Amaderada",
"Toronja, manzana",
"Jengibre, canela",
"Vetiver, maderas",
2,
"d"
],
"Caballero:HUGO BOSS|BOTTLED UNITED EDP": [
"Amaderada, Fresca",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|BOTTLED UNLIMITED": [
"Fresca, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|HUGO": [
"Aromática, Fresca",
"Manzana verde, menta, toronja",
"Salvia, lavanda, geranio",
"Abeto, cedro, pachulí",
2,
"d"
],
"Caballero:HUGO BOSS|HUGO DARK BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO ELEMENTS": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO ENERGISE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO EXTREME": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO ICED": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO INTENSE": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|HUGO JEANS": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO JEANS MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO JUST DIFERENT": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|HUGO RED": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:HUGO BOSS|HUGO REVERSED": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO URBAN JOURNEY": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|HUGO XY": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:HUGO BOSS|THE COLLECTION INVINCIBLE BERGAMOT": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:ID PARFUMS|MADRAS": [
"Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:ISSEY MIYAKE|FUSION D'ISSEY EXTREME": [
"Amaderada, Oriental",
"",
"",
"",
3,
"n",
1
],
"Caballero:ISSEY MIYAKE|L'EAU D'ISSEY": [
"Fresca, Aromática",
"Yuzu, limón, mandarina, cilantro",
"Loto, nuez moscada, canela",
"Vetiver, sándalo, cedro, almizcle",
1,
"d"
],
"Caballero:JEAN PAUL GAULTIER|GAULTIER_": [
"Aromática, Dulce",
"",
"",
"",
2,
"b",
1
],
"Caballero:JEAN PAUL GAULTIER|LE BEAU": [
"Aromática, Amaderada",
"Bergamota",
"Haba tonka, sándalo",
"Cocotero, ámbar",
2,
"b",
1
],
"Caballero:JEAN PAUL GAULTIER|LE MALE AVIATOR": [
"Fresca, Aromática",
"",
"",
"",
2,
"d",
1
],
"Caballero:JEAN PAUL GAULTIER|LE MALE ELIXIR": [
"Dulce, Aromática",
"Lavanda, menta",
"Vainilla",
"Haba tonka, benjuí",
3,
"n"
],
"Caballero:JEAN PAUL GAULTIER|LE MALE IN THE NAVY": [
"Fresca, Aromática",
"",
"",
"",
2,
"d",
1
],
"Caballero:JEAN PAUL GAULTIER|LE MALE LE PARFUM": [
"Oriental, Dulce",
"Cardamomo",
"Lavanda, iris",
"Vainilla",
3,
"n"
],
"Caballero:JEAN PAUL GAULTIER|LE MALE SUPERMAN": [
"Aromática, Dulce",
"",
"",
"",
2,
"b",
1
],
"Caballero:JEAN PAUL GAULTIER|LE MALE XMAS LIMITED EDITION": [
"Aromática, Dulce",
"",
"",
"",
2,
"b",
1
],
"Caballero:JEAN PAUL GAULTIER|SCANDAL LE PARFUM": [
"Dulce, Oriental",
"Mandarina, salvia",
"Caramelo, haba tonka",
"Vetiver, maderas",
3,
"n",
1
],
"Caballero:JEAN PAUL GAULTIER|SCANDAL POUR HOMME ABSOLUE": [
"Dulce, Oriental",
"",
"",
"",
3,
"n",
1
],
"Caballero:JEAN PAUL GAULTIER|ULTRAMALE": [
"Dulce, Aromática",
"Pera, menta, lavanda",
"Canela, salvia",
"Vainilla, ámbar, cedro",
3,
"n"
],
"Caballero:JESUS DEL POZO|HALLOWEEN MAN": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:JESUS DEL POZO|HALLOWEEN MAN ROCK ON": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:JESUS DEL POZO|HALLOWEEN MAN TATOO": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:JOOP!|JOOP HOMME": [
"Oriental, Dulce",
"Bergamota, limón, naranja",
"Canela, flor de naranjo",
"Vainilla, haba tonka, sándalo",
3,
"n"
],
"Caballero:KENZO|AQUA KENZO": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:KENZO|KENZO AIR": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:KENZO|KENZO HOMME EDP": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:KENZO|KENZO HOMME EDT INTENSE": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:KENZO|VINTAGE": [
"Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:LACOSTE|12.12 BLANC EAU INTENSE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:LACOSTE|12.12 BLANC PURE COLLECTOR": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:LACOSTE|12.12 BLEU": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:LACOSTE|12.12 JAUNE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:LACOSTE|12.12 MAGNETIC": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:LACOSTE|12.12 NOIR": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:LACOSTE|12.12 ROUGE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:LACOSTE|12.12. EAU FRAICHE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:LACOSTE|CHALLENGE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:LACOSTE|ELEGANCE LACOSTE": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:LACOSTE|ESSENTIAL": [
"Aromática, Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:LACOSTE|HOMME LACOSTE TIMELESS": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:LACOSTE|L'HOMME LACOSTE": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:LACOSTE|RED": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:LATTAFA|ASAD": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:LATTAFA|MAAHIR BLACK EDITION EDP": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:LIZ CLAIBORNE|CURVE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:LIZ CLAIBORNE|MAMBO MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:LOEWE|ESENCIA ELIXIR EAU DE PARFUM POUR HOMME": [
"Amaderada, Oriental",
"",
"",
"",
3,
"n",
1
],
"Caballero:LOEWE|LOEWE 7 COBALT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:LOEWE|SOLO LOEWE FOR MEN": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:LOEWE|SOLO VULCAN": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:LOUIS VUITTON|AU HASARD": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Caballero:LOUIS VUITTON|NOUVEAU MONDE": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:MAISON MARTIN MARGIELA|JAZZ CLUB": [
"Amaderada, Oriental",
"Pimienta rosa, neroli",
"Ron, salvia",
"Tabaco, vainilla, haba tonka",
3,
"n"
],
"Caballero:MALUMA|GARNET ROYALTY EDP": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:MERCEDES BENZ|MERCEDES BENZ": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:MERCEDES BENZ|MERCEDES BENZ SING YOUR ATTITUDE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:MICHAEL JORDAN|JORDAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:MICHAEL KORS|EXTREME BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:MICHAEL KORS|MICKAEL KORS FOR MEN": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:MOLSHEIM & CO|PLATINUM": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:MONTBLANC|EMBLEM": [
"Fresca, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:MONTBLANC|EXPLORER ULTRA BLUE": [
"Fresca, Amaderada",
"",
"",
"",
2,
"d",
1
],
"Caballero:MONTBLANC|LEGEND": [
"Aromática, Fresca",
"Lavanda, piña, bergamota",
"Manzana, rosa, geranio",
"Haba tonka, sándalo, musgo",
2,
"b"
],
"Caballero:MONTBLANC|LEGEND BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:MONTBLANC|LEGEND NIGHT": [
"Aromática, Dulce",
"",
"",
"",
2,
"n",
1
],
"Caballero:MONTBLANC|LEGEND RED": [
"Aromática, Dulce",
"",
"",
"",
2,
"b",
1
],
"Caballero:MONTBLANC|LEGEND SPIRIT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:MONTBLANC|PRESENCE": [
"Fresca, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:MUGLER|A* MEN": [
"Oriental, Dulce",
"Menta, lavanda, bergamota",
"Café, pachulí, caramelo",
"Vainilla, haba tonka, cuero",
3,
"n"
],
"Caballero:MUGLER|A* MEN KRIPTOMINT": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:MUGLER|ALIEN MAN": [
"Amaderada, Oriental",
"",
"",
"",
3,
"n",
1
],
"Caballero:NARCISO RODRIGUEZ|NARCISO RODRIGUEZ FOR HIM": [
"Amaderada, Floral",
"Violeta, lavanda",
"Almizcle",
"Vetiver, cedro",
2,
"b"
],
"Caballero:NAUTICA|AQUA RUSH GOLD": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:NAUTICA|NAUTICA": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:NAUTICA|NAUTICA LIFE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:NAUTICA|NAUTICA OCEANS": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:NAUTICA|NAUTICA VOYAGE SPORT": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:ORIGINAL PENGUIN|ICONIC BLEND": [
"Fresca, Amaderada",
"",
"",
"",
1,
"d",
1
],
"Caballero:OSCAR DE LA RENTA|GENTLEMAN": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:OSCAR DE LA RENTA|OSCAR DE LA RENTA": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:PACO RABANNE|1 MILLION GOLDEN OUD": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PACO RABANNE|BLACK XS": [
"Oriental, Dulce",
"Limón, salvia",
"Praliné, rosa, canela",
"Pachulí, cacao, ámbar",
3,
"n"
],
"Caballero:PACO RABANNE|BLACK XS L'APHRODISIACO": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PACO RABANNE|INVICTUS AQUA": [
"Fresca",
"Toronja, notas marinas",
"Pimienta rosa",
"Ámbar gris, vetiver",
2,
"d",
1
],
"Caballero:PACO RABANNE|INVICTUS AQUA 2018": [
"Fresca",
"",
"",
"",
2,
"d",
1
],
"Caballero:PACO RABANNE|INVICTUS INTENSE": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:PACO RABANNE|INVICTUS LEGEND": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:PACO RABANNE|INVICTUS ONYX": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:PACO RABANNE|INVICTUS PLATINUM": [
"Fresca, Aromática",
"",
"",
"",
2,
"d",
1
],
"Caballero:PACO RABANNE|INVICTUS VICTORY": [
"Oriental, Dulce",
"Pimienta rosa",
"Incienso, lavanda",
"Vainilla, haba tonka, ámbar",
3,
"n"
],
"Caballero:PACO RABANNE|INVICTUS VICTORY ELIXIR": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PACO RABANNE|ONE MILLION ELIXIR": [
"Dulce, Oriental",
"Davana, lavanda",
"Manzana, canela, rosa",
"Haba tonka, vainilla, ámbar",
3,
"n"
],
"Caballero:PACO RABANNE|ONE MILLION INTENSE": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PACO RABANNE|ONE MILLION LUCKY": [
"Dulce, Oriental",
"Ozono, ciruela",
"Avellana, miel",
"Algodón, cedro, pachulí",
3,
"n",
1
],
"Caballero:PACO RABANNE|ONE MILLION PRIV�": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PACO RABANNE|ONE MILLION ROYAL": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PACO RABANNE|PACO DE PACO": [
"Aromática, Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:PACO RABANNE|PACO RABANE": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:PACO RABANNE|PHANTOM": [
"Aromática, Dulce",
"Limón, lavanda",
"Lavanda, manzana",
"Vainilla, pachulí, vetiver",
2,
"b"
],
"Caballero:PACO RABANNE|PHANTOM INTENSE": [
"Aromática, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PACO RABANNE|PHANTOM LEGION": [
"Aromática, Fresca",
"",
"",
"",
2,
"b",
1
],
"Caballero:PACO RABANNE|ULTRAVIOLET HOMME": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:PACO RABANNE|XS": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:PARFUMS DE MARLY|PERSEUS": [
"Aromática, Fresca",
"",
"",
"",
2,
"b",
1
],
"Caballero:PARIS HILTON|JUST ME FOR MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PARIS HILTON|PARIS HILTON": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PEPE JEANS|PEPE JEANS FOR HIM": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PERRY ELLIS|18 MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PERRY ELLIS|360 BLACK": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:PERRY ELLIS|360 BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PERRY ELLIS|360 RED": [
"Amaderada, Oriental",
"",
"",
"",
2,
"b",
1
],
"Caballero:PERRY ELLIS|AMERICA": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:PERRY ELLIS|NIGHT": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:PERRY ELLIS|PERRY ELLIS": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PERRY ELLIS|PERRY ELLIS FOR MEN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PERRY ELLIS|RED": [
"Fresca, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:PERRY ELLIS|RESERVE": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:PIERRE CARDIN|PIERRE CARDIN": [
"Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:PITBULL|CUBA MEN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PITBULL|PITBULL MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PITBULL|PITBULL MIAMI": [
"Fresca, Amaderada",
"",
"",
"",
1,
"d",
1
],
"Caballero:PORSCHE DESIGN|THE ESSENCE INTENSE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:PRADA|LUNA ROSSA BLACK FOR MEN": [
"Oriental, Aromática",
"",
"",
"",
2,
"n",
1
],
"Caballero:PRADA|LUNA ROSSA OCEAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:PRADA|PRADA AMBER": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:PUMA|PUMA WHITE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|BIG PONY 1": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|BIG PONY 2": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|BIG PONY 4": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|POLO": [
"Aromática, Amaderada",
"Artemisa, comino, albahaca",
"Clavel, pachulí, cuero",
"Musgo de roble, pino, tabaco",
3,
"b"
],
"Caballero:RALPH LAUREN|POLO BLACK": [
"Oriental, Amaderada",
"Mango, mandarina helada",
"Salvia, artemisa",
"Pachulí, sándalo",
2,
"n"
],
"Caballero:RALPH LAUREN|POLO BLUE": [
"Fresca, Aromática",
"Pepino, melón, mandarina",
"Albahaca, salvia",
"Gamuza, almizcle",
1,
"d"
],
"Caballero:RALPH LAUREN|POLO BLUE PARFUM": [
"Fresca, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:RALPH LAUREN|POLO BLUE SPORT": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|POLO COLOGNE INTENSE": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:RALPH LAUREN|POLO DEEP BLUE": [
"Fresca, Aromática",
"",
"",
"",
2,
"d",
1
],
"Caballero:RALPH LAUREN|POLO RED": [
"Fresca, Dulce",
"Toronja, limón, arándano",
"Azafrán, jazmín",
"Café, ámbar, maderas",
2,
"b"
],
"Caballero:RALPH LAUREN|POLO RED INTENSE": [
"Oriental, Dulce",
"",
"",
"",
3,
"n",
1
],
"Caballero:RALPH LAUREN|POLO RED RUSH": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|POLO RED WHITE & BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|POLO SPORT": [
"Fresca, Aromática",
"Menta, mandarina",
"Jengibre, neroli",
"Almizcle, sándalo",
1,
"d",
1
],
"Caballero:RALPH LAUREN|POLO SUPREME OUD": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:RALPH LAUREN|POLO ULTRA BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|RALPH'S CLUB PARFUM": [
"Amaderada, Fresca",
"",
"",
"",
2,
"b",
1
],
"Caballero:RALPH LAUREN|ROMANCE MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:RALPH LAUREN|SAFARI": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:RALPH LAUREN|SAFARI FOR MEN": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:ROYALTY BY MALUMA|ONYX ROYALTY BY MALUMA": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:SALVADOR DALI|SALVADOR DALI POUR HOMME": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:SALVATORE FERRAGAMO|AQUA ESSENZIALE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:SALVATORE FERRAGAMO|AQUA ESSENZIALE BLUE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:SALVATORE FERRAGAMO|BLACK": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:SALVATORE FERRAGAMO|SALVATORE FERRAGAMO": [
"Amaderada, Aromática",
"",
"",
"",
2,
"b",
1
],
"Caballero:SAMBA|SAMBA": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:SHAWN MENDEZ|SIGNATURE": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:SWISS ARMY|STEEL": [
"Fresca, Amaderada",
"",
"",
"",
1,
"d",
1
],
"Caballero:SWISS ARMY|SWISS ARMY": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:TED LAPIDUS|TED LAPIDUS": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:TOM FORD|BEAU DE JOUR": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:TOM FORD|GREY VETIVER": [
"Amaderada, Fresca",
"Toronja, salvia",
"Iris, nuez moscada",
"Vetiver, musgo de roble",
2,
"d"
],
"Caballero:TOM FORD|NOIR EXTREME": [
"Oriental, Dulce",
"Cardamomo, nuez moscada, azafrán",
"Kulfi, rosa, jazmín",
"Vainilla, sándalo, ámbar",
3,
"n"
],
"Caballero:TOM FORD|TOM FORD FOR MEN": [
"Amaderada, Aromática",
"Bergamota, limón, mandarina",
"Pimienta, violeta",
"Cuero, ámbar, vetiver",
2,
"b"
],
"Caballero:TOMMY HILFIGER|HILFIGER EST 1985": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:TOMMY HILFIGER|IMPACT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:TOMMY HILFIGER|T FOR MEN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:TOMMY HILFIGER|TOMMY": [
"Fresca, Aromática",
"Menta, lavanda, toronja",
"Manzana, arándano",
"Cedro, almizcle",
1,
"d",
1
],
"Caballero:TOMMY HILFIGER|TOMMY 10 BOY": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:TOMMY HILFIGER|TOMMY SUMMER OCEAN WAVE": [
"Fresca",
"",
"",
"",
1,
"d",
1
],
"Caballero:TOUS|IN HEAVEN HIM": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:TOUS|TOUS MAN": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:TOUS|TOUS MAN CHILL": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:TOUS|TOUS MAN INTENSE": [
"Amaderada, Oriental",
"",
"",
"",
2,
"n",
1
],
"Caballero:TOUS|TOUS MAN SPORT": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Caballero:VERSACE|BLUE JEANS": [
"Fresca, Dulce",
"",
"",
"",
2,
"b",
1
],
"Caballero:VERSACE|DREAMER": [
"Aromática, Floral",
"",
"",
"",
2,
"b",
1
],
"Caballero:VERSACE|DYLAN BLUE": [
"Fresca, Aromática",
"Bergamota, toronja, hoja de higuera",
"Violeta, pimienta, ambroxan",
"Incienso, almizcle, haba tonka",
2,
"b"
],
"Caballero:VERSACE|VERSACE": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Caballero:VERSACE|VERSACE POUR HOMME 2008": [
"Fresca, Aromática",
"Limón, neroli, bergamota",
"Cedro, salvia, geranio",
"Haba tonka, almizcle, ámbar",
1,
"d"
],
"Caballero:VIKTOR & ROLF|SPICEBOMB EXTREME": [
"Oriental, Amaderada",
"Pimienta, comino",
"Tabaco, chile",
"Cuero, vainilla",
3,
"n"
],
"Caballero:VIKTOR & ROLF|SPICEBOMB INFRARED": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:VIKTOR & ROLF|SPICEBOMB NIGHT VISION EAU DE PARFUM": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:YVES SAINT LAURENT|L'HOMME LIBRE": [
"Aromática, Fresca",
"Lavanda, bergamota",
"Salvia, geranio",
"Vetiver, maderas",
2,
"b",
1
],
"Caballero:YVES SAINT LAURENT|MYSLF EAU DE PARFUM": [
"Floral, Amaderada",
"Bergamota",
"Flor de naranjo",
"Ambrofix, maderas",
2,
"b",
1
],
"Caballero:YVES SAINT LAURENT|OPIUM": [
"Oriental, Amaderada",
"",
"",
"",
3,
"n",
1
],
"Caballero:YVES SAINT LAURENT|Y EAU FRAICHE": [
"Fresca, Aromática",
"",
"",
"",
1,
"d",
1
],
"Dama:RASASI|HAWAS FOR HER": [
"Dulce, Floral",
"",
"",
"",
3,
"n",
1
],
"Caballero:AZZARO|NIGHT TIME": [
"Oriental, Amaderada",
"",
"",
"",
2,
"n",
1
],
"Caballero:RASASI|HAWAS BLACK RASASI": [
"Fresca, Dulce",
"",
"",
"",
3,
"b",
1
],
"Caballero:CREED|MILLESIME IMPERIAL": [
"Fresca, Dulce",
"Melón, limón, bergamota",
"Iris, notas marinas",
"Almizcle, ámbar",
2,
"d",
1
],
"Caballero:YVES SAINT LAURENT|JAZZ": [
"Aromática, Amaderada",
"",
"",
"",
2,
"b",
1
],
"Unisex:EX NIHILO|BLUE TALISMAN": [
"Amaderada, Dulce",
"",
"",
"",
2,
"b",
1
],
"Dama:CACHAREL|NOA": [
"Floral",
"",
"",
"",
1,
"d",
1
],
"Dama:LANCÔME|IDÔLE PEACH'N ROSES": [
"Floral, Dulce",
"",
"",
"",
2,
"b",
1
],
"Caballero:VALENTINO|VALENTINO UOMO BORN IN ROMA CORAL FANTASY": [
"Dulce, Fresca",
"",
"",
"",
2,
"d",
1
],
"Dama:CAROLINA HERRERA|LA BOMBA INTENSE": [
"Floral, Dulce",
"",
"",
"",
3,
"n",
1
]
};
const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 ]+/g,'').replace(/\s+/g,' ').trim();
const INT=['','Discreta','Moderada','Intensa'], MOM={d:'Día',n:'Noche',b:'Día y noche'};
const table=new Map(Object.entries({...P2,...P}).map(([k,v])=>{const m=k.match(/^(Dama|Caballero|Unisex|Nicho):(.*)$/);const [b,n]=(m?m[2]:k).split('|');
  const o={familia:v[0],notasSalida:v[1],notasCorazon:v[2],notasFondo:v[3],intensidad:INT[v[4]],momento:MOM[v[5]]};if(v[6])o.aproximado=true;
  return [(m?m[1]+':':'')+key(b)+'|'+key(n),o]}));
// Variantes de escritura conocidas en el catálogo.
const alias={'ARMANI|SI':'ARMANI|S','HERMES|TERRES D HERMES':'HERMES|TERRES DHERMES','LOUIS VUITTON|LIMMENSIT':'LOUIS VUITTON|LIMMENSITE'};
function suggest(r){
  const b=key(r.disenador||r.brand),n=key(r.referencia||r.name),g=(r.linea||r.gender||'')+':';
  const k=b+'|'+n, k2=b+'|'+n.replace(new RegExp('^'+b.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' '),'');
  return table.get(g+k)||table.get(k)||table.get(alias[k])||table.get(k2)||null;
}
root.InstintoPerfiles={suggest,key,size:table.size};
})(typeof window!=='undefined'?window:globalThis);
