import Foundation

extension Date {
    // MARK: - Formatting helpers
    var shortDate: String {
        formatted(.dateTime.month(.abbreviated).day())
    }

    var mediumDate: String {
        formatted(.dateTime.month(.wide).day().year())
    }

    var dayMonthYear: String {
        formatted(date: .abbreviated, time: .omitted)
    }

    var timeOnly: String {
        formatted(date: .omitted, time: .shortened)
    }

    var relativeDay: String {
        if Calendar.current.isDateInToday(self) { return "Today" }
        if Calendar.current.isDateInYesterday(self) { return "Yesterday" }
        return shortDate
    }

    // MARK: - Midnight UTC (for Firestore daily document keys)
    var midnightUTC: Date {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        return cal.startOfDay(for: self)
    }

    // MARK: - Age in years
    var ageInYears: Int {
        Calendar.current.dateComponents([.year], from: self, to: Date()).year ?? 0
    }

    // MARK: - Firestore-friendly date string
    var firestoreDateKey: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter.string(from: self)
    }
}
