import Foundation

/// A trip to Kyoto, the one the widgets' gallery shows too: what the
/// complication gallery draws before the phone sent anything, and what the
/// screenshot mode of the watch app runs on (TREKWatch/DemoMode.swift).
enum WatchSample {
    enum Scenario: String {
        /// Day 3 of 9, early afternoon.
        case running
        /// Day 1, the flight out leaves in the afternoon.
        case travelday
        /// Twelve days before the trip.
        case upcoming
    }

    static func snapshot(_ scenario: Scenario, now: Date = Date()) -> WatchSnapshot {
        let startOffset: Int
        switch scenario {
        case .running: startOffset = -2
        case .travelday: startOffset = 0
        case .upcoming: startOffset = 12
        }
        let calendar = Calendar.current
        let iso: (Int) -> String = { TrekDate.iso(calendar.date(byAdding: .day, value: startOffset + $0, to: now) ?? now) }
        // The flight out leaves in the afternoon, so the screenshot mode can run
        // every scenario at about one o'clock, the hour the capture sets its clock to.
        let stops: [[WatchSnapshot.Stop]] = [
            [
                stop("LH 716", 15 * 60 + 35, symbol: "airplane", color: nil, booking: "flight", lat: 50.0379, lng: 8.5622, address: "Frankfurt Airport"),
            ],
            [
                stop("Shinkansen Nozomi 21", 13 * 60 + 33, symbol: "tram.fill", color: nil, booking: "train", lat: 35.6812, lng: 139.7671, address: "Tokyo Station"),
                stop("Hotel Kanra Kyoto", 16 * 60 + 30, symbol: "bed.double.fill", color: nil, booking: "hotel", lat: 34.9922, lng: 135.7585, address: "190 Kitamachi, Shimogyo Ward, Kyoto"),
            ],
            [
                stop("Fushimi Inari Taisha", 8 * 60 + 30, end: 10 * 60 + 30, symbol: "building.columns.fill", color: "#D6273B", lat: 34.9671, lng: 135.7727, address: "68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto"),
                stop(t("Nishiki Market"), 11 * 60, end: 12 * 60 + 30, symbol: "basket.fill", color: "#E8A13A", lat: 35.0050, lng: 135.7649, address: "Nishikikoji-dori, Nakagyo Ward, Kyoto"),
                stop("Kiyomizu-dera", 13 * 60 + 30, end: 15 * 60 + 30, symbol: "leaf.fill", color: "#2FA37A", lat: 34.9949, lng: 135.7850, address: "1-294 Kiyomizu, Higashiyama Ward, Kyoto", note: t("Go up the Sannenzaka steps for the view.")),
                stop(t("Gion walk"), 16 * 60, symbol: "figure.walk", color: "#4A7DDB", lat: 35.0037, lng: 135.7750, address: "Hanamikoji-dori, Higashiyama Ward, Kyoto"),
                stop(t("Kaiseki at Kikunoi"), 19 * 60, symbol: "fork.knife", color: nil, booking: "restaurant", lat: 34.9989, lng: 135.7812, address: "459 Shimokawaracho, Higashiyama Ward, Kyoto"),
            ],
            [
                stop(t("Arashiyama Bamboo Grove"), 9 * 60, symbol: "tree.fill", color: "#2FA37A", lat: 35.0170, lng: 135.6713, address: "Sagaogurayama Tabuchiyamacho, Kyoto"),
                stop("Tenryu-ji", 10 * 60 + 30, symbol: "building.columns.fill", color: "#D6273B", lat: 35.0157, lng: 135.6738, address: "68 Sagatenryuji Susukinobabacho, Kyoto"),
                stop("Kinkaku-ji", 14 * 60, symbol: "building.columns.fill", color: "#D6273B", lat: 35.0394, lng: 135.7292, address: "1 Kinkakujicho, Kita Ward, Kyoto"),
            ],
            [stop(t("Nara Park"), 10 * 60, symbol: "leaf.fill", color: "#2FA37A", lat: 34.6851, lng: 135.8430, address: "Nara"), stop("Todai-ji", 11 * 60 + 30, symbol: "building.columns.fill", color: "#D6273B", lat: 34.6890, lng: 135.8398, address: "406-1 Zoshicho, Nara")],
            [stop(t("Philosopher's Path"), 9 * 60 + 30, symbol: "figure.walk", color: "#4A7DDB", lat: 35.0266, lng: 135.7948, address: "Sakyo Ward, Kyoto"), stop("Ginkaku-ji", 11 * 60, symbol: "building.columns.fill", color: "#D6273B", lat: 35.0270, lng: 135.7982, address: "2 Ginkakujicho, Sakyo Ward, Kyoto")],
            [stop(t("Tea ceremony"), 10 * 60 + 30, symbol: "ticket.fill", color: nil, booking: "event", lat: 35.0036, lng: 135.7788, address: "Camellia Flower, Higashiyama")],
            [stop(t("Fushimi sake district"), 14 * 60, symbol: "wineglass.fill", color: "#8E6CD9", lat: 34.9318, lng: 135.7601, address: "Fushimi Ward, Kyoto"), stop(t("Pontocho alley"), 18 * 60 + 30, symbol: "fork.knife", color: "#E8A13A", lat: 35.0050, lng: 135.7708, address: "Pontocho, Nakagyo Ward, Kyoto")],
            [stop(t("Shinkansen to Osaka"), 9 * 60 + 12, symbol: "tram.fill", color: nil, booking: "train", lat: 34.9858, lng: 135.7588, address: "Kyoto Station"), stop("LH 741", 13 * 60 + 25, symbol: "airplane", color: nil, booking: "flight", lat: 34.4320, lng: 135.2304, address: "Kansai International Airport")],
        ]
        let days = stops.enumerated().map { index, stops in
            WatchSnapshot.Day(date: iso(index), number: index + 1, title: nil, stops: stops)
        }
        let bookings: [WatchSnapshot.Booking] = [
            WatchSnapshot.Booking(
                id: 1, title: "LH 716", kind: "flight", confirmed: true, date: iso(0), time: "15:35", endDate: iso(1), endTime: "11:20",
                zone: nil, from: .init(name: "Frankfurt", code: "FRA", lat: 50.0379, lng: 8.5622),
                to: .init(name: "Tokyo Haneda", code: "HND", lat: 35.5494, lng: 139.7798), code: "K7Q2XD",
                carrier: "Lufthansa LH 716", seat: "42A", platform: nil, location: nil, lat: nil, lng: nil, checkIn: nil, checkOut: nil
            ),
            WatchSnapshot.Booking(
                id: 7, title: "Shinkansen Nozomi 21", kind: "train", confirmed: true, date: iso(1), time: "13:33", endDate: iso(1), endTime: "15:48",
                zone: nil, from: .init(name: "Tokyo", code: nil, lat: 35.6812, lng: 139.7671), to: .init(name: "Kyoto", code: nil, lat: 34.9858, lng: 135.7588),
                code: "JR-5521", carrier: "JR Nozomi 21", seat: "7D", platform: "14", location: nil, lat: nil, lng: nil, checkIn: nil, checkOut: nil
            ),
            WatchSnapshot.Booking(
                id: 2, title: "Hotel Kanra Kyoto", kind: "hotel", confirmed: true, date: iso(1), time: "16:30", endDate: iso(7), endTime: "11:00",
                zone: nil, from: nil, to: nil, code: "HK-208431", carrier: nil, seat: nil, platform: nil,
                location: "Hotel Kanra Kyoto", lat: 34.9922, lng: 135.7585, checkIn: "15:00", checkOut: "11:00"
            ),
            WatchSnapshot.Booking(
                id: 3, title: t("Kaiseki at Kikunoi"), kind: "restaurant", confirmed: false, date: iso(2), time: "19:00", endDate: nil, endTime: nil,
                zone: nil, from: nil, to: nil, code: "KK-77", carrier: nil, seat: nil, platform: nil,
                location: "459 Shimokawaracho, Higashiyama", lat: 34.9989, lng: 135.7812, checkIn: nil, checkOut: nil
            ),
            WatchSnapshot.Booking(
                id: 4, title: t("Tea ceremony"), kind: "event", confirmed: true, date: iso(5), time: "10:30", endDate: nil, endTime: nil,
                zone: nil, from: nil, to: nil, code: nil, carrier: nil, seat: nil, platform: nil,
                location: "Camellia Flower", lat: 35.0036, lng: 135.7788, checkIn: nil, checkOut: nil
            ),
            WatchSnapshot.Booking(
                id: 5, title: "Shinkansen Hikari 503", kind: "train", confirmed: true, date: iso(8), time: "09:12", endDate: iso(8), endTime: "09:27",
                zone: nil, from: .init(name: "Kyoto", code: nil, lat: 34.9858, lng: 135.7588), to: .init(name: "Shin-Osaka", code: nil, lat: 34.7334, lng: 135.5001),
                code: "E4521", carrier: "JR Hikari 503", seat: "7D", platform: "12", location: nil, lat: nil, lng: nil, checkIn: nil, checkOut: nil
            ),
            WatchSnapshot.Booking(
                id: 6, title: "LH 741", kind: "flight", confirmed: true, date: iso(8), time: "13:25", endDate: iso(8), endTime: "19:05",
                zone: nil, from: .init(name: "Osaka Kansai", code: "KIX", lat: 34.4320, lng: 135.2304),
                to: .init(name: "Frankfurt", code: "FRA", lat: 50.0379, lng: 8.5622), code: "K7Q2XD",
                carrier: "Lufthansa LH 741", seat: "38C", platform: nil, location: nil, lat: nil, lng: nil, checkIn: nil, checkOut: nil
            ),
        ]
        let packingItems: [(String, String, Bool)] = [
            (t("Passport"), t("Documents"), true), (t("JR Pass voucher"), t("Documents"), true), (t("Travel insurance"), t("Documents"), true),
            (t("Rain jacket"), t("Clothes"), false), (t("Walking shoes"), t("Clothes"), true), (t("Warm sweater"), t("Clothes"), false), (t("Socks"), t("Clothes"), true),
            (t("Camera"), t("Tech"), true), (t("Power bank"), t("Tech"), false), (t("Type A adapter"), t("Tech"), false),
            (t("Toothbrush"), t("Toiletries"), false), (t("Sunscreen"), t("Toiletries"), true),
        ]
        var packingList: [WatchSnapshot.Item] = []
        for (offset, entry) in packingItems.enumerated() {
            packingList.append(WatchSnapshot.Item(id: 100 + offset, name: entry.0, done: entry.2, group: entry.1))
        }
        let packing = WatchSnapshot.Packing(
            items: packingList.filter { !$0.done } + packingList.filter(\.done),
            packed: packingList.filter(\.done).count,
            total: packingList.count
        )
        // Due dates in days from now, priority, done.
        let todoItems: [(String, Int?, Int, Bool)] = [
            (t("Reserve the Ghibli Museum"), 2, 3, false), (t("Buy a Suica card"), nil, 2, false),
            (t("Book the tea ceremony"), nil, 1, false), (t("Print the hotel voucher"), nil, 0, false),
            (t("Order yen"), -1, 0, true), (t("Renew passport"), -20, 0, true),
        ]
        var todoList: [WatchSnapshot.Item] = []
        for (offset, entry) in todoItems.enumerated() {
            let due: String? = entry.1.map { iso($0 - startOffset) }
            todoList.append(WatchSnapshot.Item(id: 200 + offset, name: entry.0, done: entry.3, group: nil, due: due, priority: entry.2))
        }
        let todos = WatchSnapshot.Todos(items: todoList, open: todoItems.filter { !$0.3 }.count, total: todoItems.count)
        return WatchSnapshot(
            generatedAt: ISO8601DateFormatter().string(from: now.addingTimeInterval(-4 * 60)),
            // The clock of the watch's region, as a user's TREK setting would usually match it.
            hour12: DateFormatter.dateFormat(fromTemplate: "j", options: 0, locale: .current)?.contains("a") ?? false,
            trip: .init(id: 1, title: t("Autumn in Kyoto"), start: iso(0), end: iso(8), place: t("Kyoto, Japan"), cover: nil),
            days: days,
            bookings: bookings,
            weather: .init(temp: 18, high: 21, low: 11, main: scenario == .upcoming ? "Clouds" : "Clear", label: t("Mostly sunny"), place: "Kyoto", rain: 10),
            packing: packing,
            todos: todos,
            applied: []
        )
    }

    /// The sample's own texts in German and Russian, so the screenshots in those
    /// languages show a trip written in them; every other language gets the English.
    private static let translations: [String: [String: String]] = [
        "Autumn in Kyoto": ["de": "Herbst in Kyoto", "ru": "Осень в Киото"],
        "Kyoto, Japan": ["de": "Kyoto, Japan", "ru": "Киото, Япония"],
        "Nishiki Market": ["de": "Nishiki-Markt", "ru": "Рынок Нисики"],
        "Gion walk": ["de": "Spaziergang durch Gion", "ru": "Прогулка по Гиону"],
        "Kaiseki at Kikunoi": ["de": "Kaiseki im Kikunoi", "ru": "Кайсэки в Kikunoi"],
        "Arashiyama Bamboo Grove": ["de": "Bambuswald Arashiyama", "ru": "Бамбуковая роща Арасиямы"],
        "Nara Park": ["de": "Nara-Park", "ru": "Парк Нара"],
        "Philosopher's Path": ["de": "Philosophenweg", "ru": "Тропа философа"],
        "Tea ceremony": ["de": "Teezeremonie", "ru": "Чайная церемония"],
        "Fushimi sake district": ["de": "Sake-Viertel Fushimi", "ru": "Саке-квартал Фусими"],
        "Pontocho alley": ["de": "Gasse Pontocho", "ru": "Улочка Понтотё"],
        "Shinkansen to Osaka": ["de": "Shinkansen nach Osaka", "ru": "Синкансэн в Осаку"],
        "Go up the Sannenzaka steps for the view.": ["de": "Für den Ausblick die Sannenzaka-Treppe hinauf.", "ru": "Ради вида поднимитесь по лестнице Саннэндзака."],
        "Mostly sunny": ["de": "Überwiegend sonnig", "ru": "Преимущественно солнечно"],
        "Passport": ["de": "Reisepass", "ru": "Паспорт"],
        "JR Pass voucher": ["de": "JR-Pass-Gutschein", "ru": "Ваучер JR Pass"],
        "Travel insurance": ["de": "Reiseversicherung", "ru": "Страховка"],
        "Rain jacket": ["de": "Regenjacke", "ru": "Дождевик"],
        "Walking shoes": ["de": "Wanderschuhe", "ru": "Удобная обувь"],
        "Warm sweater": ["de": "Warmer Pullover", "ru": "Тёплый свитер"],
        "Socks": ["de": "Socken", "ru": "Носки"],
        "Camera": ["de": "Kamera", "ru": "Фотоаппарат"],
        "Power bank": ["de": "Powerbank", "ru": "Пауэрбанк"],
        "Type A adapter": ["de": "Reiseadapter Typ A", "ru": "Переходник типа A"],
        "Toothbrush": ["de": "Zahnbürste", "ru": "Зубная щётка"],
        "Sunscreen": ["de": "Sonnencreme", "ru": "Солнцезащитный крем"],
        "Documents": ["de": "Dokumente", "ru": "Документы"],
        "Clothes": ["de": "Kleidung", "ru": "Одежда"],
        "Tech": ["de": "Technik", "ru": "Техника"],
        "Toiletries": ["de": "Kulturbeutel", "ru": "Гигиена"],
        "Reserve the Ghibli Museum": ["de": "Ghibli-Museum reservieren", "ru": "Забронировать музей Гибли"],
        "Buy a Suica card": ["de": "Suica-Karte kaufen", "ru": "Купить карту Suica"],
        "Book the tea ceremony": ["de": "Teezeremonie buchen", "ru": "Записаться на чайную церемонию"],
        "Print the hotel voucher": ["de": "Hotelgutschein drucken", "ru": "Распечатать ваучер отеля"],
        "Order yen": ["de": "Yen bestellen", "ru": "Заказать иены"],
        "Renew passport": ["de": "Reisepass verlängern", "ru": "Продлить паспорт"],
    ]

    private static func t(_ english: String) -> String {
        let language = Locale.current.language.languageCode?.identifier ?? "en"
        return translations[english]?[language] ?? english
    }

    private static func stop(_ name: String, _ minutes: Int, end: Int? = nil, symbol: String, color: String?, booking: String? = nil,
                             lat: Double, lng: Double, address: String, note: String? = nil) -> WatchSnapshot.Stop {
        WatchSnapshot.Stop(name: name, minutes: minutes, endMinutes: end, symbol: symbol, color: color, address: address,
                           lat: lat, lng: lng, booking: booking, note: note)
    }
}
