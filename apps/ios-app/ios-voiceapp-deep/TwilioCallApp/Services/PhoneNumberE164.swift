//
//  PhoneNumberE164.swift
//  TwilioCallApp
//

import Foundation

enum PhoneNumberE164 {
    /// Strips formatting and returns E.164 like `+14155552671`. Falls back to digits-only with `+` if already international.
    static func normalize(_ raw: String, defaultCountryCode: String = "1") -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return "" }

        var digits = String(trimmed.filter { $0.isNumber })
        if trimmed.hasPrefix("+") {
            return "+\(digits)"
        }
        if digits.count == 10 {
            digits = defaultCountryCode + digits
        }
        if digits.hasPrefix("00") {
            digits = String(digits.dropFirst(2))
        }
        return "+\(digits)"
    }

    /// Compare two numbers ignoring formatting and optional US country code.
    static func sameNumber(_ a: String, _ b: String) -> Bool {
        func digits(_ raw: String) -> String {
            normalize(raw).filter(\.isNumber)
        }
        let da = digits(a)
        let db = digits(b)
        if da.isEmpty || db.isEmpty { return false }
        if da == db { return true }
        if da.count == 10, db.count == 11, db.hasPrefix("1"), String(db.dropFirst()) == da { return true }
        if db.count == 10, da.count == 11, da.hasPrefix("1"), String(da.dropFirst()) == db { return true }
        return false
    }
}
